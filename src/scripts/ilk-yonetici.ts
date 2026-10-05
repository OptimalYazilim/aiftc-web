import 'dotenv/config'
import { getPayload } from 'payload'

import config from '../payload.config.js'

/**
 * İLK YÖNETİCİ HESABI — boş üretim veritabanında panele girebilmek için
 * ============================================================================
 * NEDEN PAYLOAD'IN "İLK KULLANICIYI OLUŞTUR" EKRANI KULLANILMIYOR
 * ---------------------------------------------------------------------------
 * O ekran kaydı istekte OTURUM OLMADAN açar. `Users.beforeValidate`, panel
 * yöneticisinin açmadığı her hesabı rolsüz, `trainee`, `pending` yapar
 * (dışarıdan kayıt sanitasyonu — bilinçli tasarım, bkz. Users.ts ve
 * docs/access-control-guide.md 9.4). Sonuç: ilk hesap yönetici OLAMAZ,
 * ardından gelen otomatik giriş de onaysız hesap kuralına takılır. Ayrıca
 * genel kayıt kapalıyken `beforeOperation` isteği hiç kabul etmez.
 *
 * Bu betik hesabı sunucuda, komut satırından açar: dışarıya açık bir "ilk
 * gelen yönetici olur" penceresi bırakmaz.
 *
 * KULLANIM (sunucuda, kurulum kılavuzu: deploy/README.md)
 *   read -r  -p 'E-posta: ' ILK_YONETICI_EPOSTA
 *   read -rs -p 'Parola: '  ILK_YONETICI_PAROLA; echo
 *   export ILK_YONETICI_EPOSTA ILK_YONETICI_PAROLA
 *   docker compose --env-file .env.production run --rm \
 *     -e ILK_YONETICI_EPOSTA -e ILK_YONETICI_PAROLA migrate pnpm ilk-yonetici
 *
 * Parola komut satırına YAZILMAZ (kabuk geçmişine düşerdi); ortam
 * değişkeninden okunur ve hiçbir yere basılmaz.
 *
 * GÜVENLİK SINIRI: veritabanında zaten bir yönetici varsa betik HİÇBİR ŞEY
 * yapmaz. Sonraki hesaplar panelden, yönetici oturumuyla açılır.
 * ============================================================================
 */

/*
  `Users.beforeValidate` istekte bir panel yöneticisi görmezse rolleri sıyırır.
  Gerçek bir yönetici henüz YOKTUR (yumurta-tavuk); bu sentetik bağlam yalnızca
  bu tek oluşturma çağrısında kullanılır. Aynı yöntem E2E tohumunda da
  kullanılır (e2e/yardimcilar/tohum.ts → YONETICI_BAGLAMI).
*/
const KURULUM_BAGLAMI = {
  id: 0,
  email: 'kurulum@localhost',
  roles: ['admin'],
  role: 'admin',
  collection: 'users',
}

const hata = (mesaj: string): never => {
  console.error(`[ilk-yonetici] ${mesaj}`)
  process.exit(1)
}

const calistir = async () => {
  const eposta = process.env.ILK_YONETICI_EPOSTA?.trim().toLowerCase() ?? ''
  const parola = process.env.ILK_YONETICI_PAROLA ?? ''
  const ad = process.env.ILK_YONETICI_AD?.trim() || 'Sistem Yöneticisi'

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(eposta)) hata('ILK_YONETICI_EPOSTA geçerli bir e-posta adresi olmalı.')
  if (!parola) hata('ILK_YONETICI_PAROLA tanımlı değil.')

  const payload = await getPayload({ config })

  const yoneticiler = await payload.find({
    collection: 'users',
    where: { roles: { in: ['admin'] } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  if (yoneticiler.totalDocs > 0) {
    hata('Veritabanında zaten bir yönetici var; hiçbir şey yapılmadı. Yeni hesapları panelden açın.')
  }

  const ayniEposta = await payload.find({
    collection: 'users',
    where: { email: { equals: eposta } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  if (ayniEposta.totalDocs > 0) hata(`${eposta} adresiyle bir hesap zaten var; hiçbir şey yapılmadı.`)

  try {
    await payload.create({
      collection: 'users',
      data: { name: ad, email: eposta, password: parola, roles: ['admin'], role: 'admin', accountStatus: 'approved' } as never,
      user: KURULUM_BAGLAMI as never,
      overrideAccess: true,
      context: { skipRevalidate: true },
    })
  } catch (err) {
    hata(`Hesap açılamadı: ${err instanceof Error ? err.message : String(err)}`)
  }

  /*
    OKUYUP DOĞRULA: hesap gerçekten yönetici ve onaylı mı, ve giriş yapabiliyor
    mu? `beforeLogin` onaysız hesabı reddeder; giriş başarılıysa panel açılır.
  */
  const yazilan = (
    await payload.find({ collection: 'users', where: { email: { equals: eposta } }, limit: 1, depth: 0, overrideAccess: true })
  ).docs[0] as unknown as { roles?: string[]; accountStatus?: string } | undefined
  if (!yazilan?.roles?.includes('admin') || yazilan.accountStatus !== 'approved') {
    hata(`Hesap beklenen hâlde değil (roles=${String(yazilan?.roles)}, accountStatus=${String(yazilan?.accountStatus)}).`)
  }

  try {
    await payload.login({ collection: 'users', data: { email: eposta, password: parola } })
  } catch (err) {
    hata(`Hesap açıldı ama giriş denemesi başarısız: ${err instanceof Error ? err.message : String(err)}`)
  }

  console.log(`[ilk-yonetici] Yönetici hesabı açıldı ve giriş doğrulandı: ${eposta}`)
  process.exit(0)
}

calistir().catch((err) => hata(err instanceof Error ? err.message : String(err)))
