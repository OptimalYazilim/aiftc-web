import type { Payload, Where } from 'payload'

import type { ClassroomRole } from './virtualClassroom'

/**
 * SANAL SINIF — HESAPLA GİRİŞ VE KATILIM KAYDI (sunucu yardımcıları)
 * ============================================================================
 * Katılım sayfası (görünüm) ve sunucu eylemi (bağlayıcı karar) AYNI kuralı
 * kullanır; kural tek yerde yaşar.
 *
 * KİM HESABIYLA ŞİFRESİZ GİREBİLİR
 *   Oturum açmış ve odanın bağlı olduğu eğitime KENDİ başvurusu "Onaylandı"
 *   ya da "Tamamlandı" olan kişi. "Kendi" = başvuru hesabına bağlı (`user`)
 *   YA DA başvurudaki e-posta hesabın e-postasıyla AYNI (büyük/küçük harf
 *   farkı yok sayılır).
 *
 * NEDEN `registrationReadAccess` KULLANILMIYOR
 *   O kural personele ve panel rollerine BÜTÜN başvuruları açar. Onunla
 *   sorulsaydı "bu eğitimde onaylı bir başvuru var mı?" sorusu bir personel
 *   için HER ZAMAN evet olurdu ve personel başkasının başvurusuyla girerdi.
 *   Bu yüzden eşleşme burada açıkça kurulur. Personel ve eğitmen, panelde
 *   tanımlı katılımcı/eğitmen şifresiyle girer (yedek yol).
 *
 * E-posta `like` ile ADAY olarak bulunur (Postgres'te `equals` büyük/küçük
 * harfe duyarlıdır), sonra JavaScript'te TAM eşitlikle süzülür: `like`
 * "içerir" demektir ve tek başına `a@b.com` ile `xa@b.com`u eşleştirirdi.
 * ============================================================================
 */

export const ONAYLI_DURUMLAR = ['approved', 'completed'] as const

export type Kullanici = {
  id: number | string
  email?: string | null
  name?: string | null
}

export type OnayliBasvuru = {
  id: number | string
  fullName?: string | null
  email?: string | null
}

type BasvuruSatiri = OnayliBasvuru & { user?: number | { id: number } | null }

/*
  `toLowerCase()` — `toLocaleLowerCase('tr')` DEĞİL. Türkçe kuralında büyük
  `I` noktasız `ı` olur: `YILMAZ@OGM.GOV.TR` → `yılmaz@…` ve eşleşme düşer
  (E2E 18 bunu yakaladı). E-posta adresinin büyük/küçük harf eşlemesi dilden
  bağımsızdır.
*/
const kucuk = (deger: unknown) => (typeof deger === 'string' ? deger.trim().toLowerCase() : '')

export const onayliBasvuruBul = async (
  payload: Payload,
  kullanici: Kullanici,
  egitimId: number,
): Promise<OnayliBasvuru | null> => {
  const eposta = kucuk(kullanici.email)
  const kosullar: Where[] = [
    { user: { equals: kullanici.id } },
    ...(eposta ? [{ email: { like: eposta } }] : []),
  ]

  const sonuc = await payload.find({
    collection: 'registrations',
    where: {
      and: [
        { training: { equals: egitimId } },
        { status: { in: [...ONAYLI_DURUMLAR] } },
        { or: kosullar },
      ],
    },
    limit: 20,
    depth: 0,
    overrideAccess: true,
  })

  const kendi = (sonuc.docs as unknown as BasvuruSatiri[]).find((b) => {
    const bagliId = typeof b.user === 'object' && b.user !== null ? b.user.id : b.user
    if (bagliId != null && String(bagliId) === String(kullanici.id)) return true
    return eposta !== '' && kucuk(b.email) === eposta
  })

  return kendi ? { id: kendi.id, fullName: kendi.fullName, email: kendi.email } : null
}

/**
 * Başarılı bir girişi yazar. Kayıt HİÇBİR ZAMAN girişi engellemez: yazılamazsa
 * hata günlüğe düşer ve kişi yine odaya alınır — katılımcıyı bir günlük
 * yazma hatası yüzünden dersin dışında bırakmak kabul edilemez.
 */
export const girisiKaydet = async (
  payload: Payload,
  giris: {
    odaId: number
    egitimId: number | null
    yol: 'account' | 'code'
    rol: ClassroomRole
    kullanici: Kullanici | null
    basvuru: OnayliBasvuru | null
  },
): Promise<void> => {
  try {
    await payload.create({
      collection: 'classroom-attendance',
      data: {
        room: giris.odaId,
        training: giris.egitimId ?? undefined,
        method: giris.yol,
        role: giris.rol,
        fullName: giris.basvuru?.fullName ?? giris.kullanici?.name ?? undefined,
        email: giris.basvuru?.email ?? giris.kullanici?.email ?? undefined,
        user: giris.kullanici?.id ?? undefined,
        registration: giris.basvuru?.id ?? undefined,
      } as never,
      overrideAccess: true,
    })
  } catch (err) {
    payload.logger.error({ err, room: giris.odaId }, 'Sanal sınıf girişi kaydedilemedi')
  }
}
