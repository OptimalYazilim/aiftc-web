'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

/**
 * OTURUM DURUMU — SİTE TARAFINDA TEK KAYNAK
 * ============================================================================
 * NEDEN BİR BAĞLAM (CONTEXT) GEREKİYOR
 * ---------------------------------------------------------------------------
 * Oturum çerezi (`aiftc-token`) **httpOnly**'dir: JavaScript onu OKUYAMAZ ve
 * okumamalıdır — XSS ile çalınmasını engelleyen şey tam olarak budur. Yani
 * istemci tarafı "giriş yapılmış mı?" sorusunu ancak sunucuya sorarak
 * yanıtlayabilir: `/api/users/me`.
 *
 * Bu bağlam kurulmadan önce o soruyu ÜÇ AYRI BİLEŞEN ayrı ayrı soruyordu
 * (`SubscriptionBanner`, `SessionTimeoutNotice` ve başlıktaki hesap menüsü):
 * her sayfa yüklemesinde üç özdeş istek. Üstelik üçü birbirinden bağımsız
 * cevap aldığı için, biri "oturum var" öteki "yok" diyebilecek bir yarış
 * durumu da vardı.
 *
 * Artık tek istek atılır, sonuç paylaşılır.
 *
 * ---------------------------------------------------------------------------
 * NEDEN SUNUCU BİLEŞENİNDE ÇEREZ OKUNMUYOR
 * ---------------------------------------------------------------------------
 * Teknik olarak mümkündü: başlık sunucuda çerezi okuyup doğru hâli basabilirdi.
 * Ama sitenin sayfaları statik/ISR olarak üretiliyor; başlık yerleşimin
 * parçası olduğu için bunu yapmak **her sayfayı dinamik hâle getirirdi** ve
 * tüm önbellek kalkardı. Kılavuz 5.6.2'de aynı ödünleşim yazılı.
 *
 * Bedeli: ilk boyamada oturum HENÜZ BİLİNMEZ (`durum: 'okunuyor'`). Bunu
 * gizlemiyoruz — tüketen bileşenler o anda ne göstereceklerine kendileri
 * karar verir (bkz. `AccountMenu`).
 *
 * ---------------------------------------------------------------------------
 * `yenile()` NE ZAMAN ÇAĞRILIR
 * ---------------------------------------------------------------------------
 * Oturum durumunu DEĞİŞTİREN her işlemden sonra: çıkış, oturum uzatma. Giriş
 * bunun istisnasıdır — giriş tam sayfa geçişiyle biter (`window.location`),
 * yeni belge zaten sıfırdan okur.
 * ============================================================================
 */

export type OturumKullanicisi = {
  id?: number | string
  email?: string
  name?: string
  role?: unknown
  roles?: unknown
  subscriptionPlan?: unknown
  subscriptionEndsAt?: unknown
}

export type OturumDurumu = {
  /**
   *  okunuyor → `/api/users/me` henüz yanıtlamadı. HİÇBİR ŞEY VARSAYILMAZ.
   *  yok      → oturum açık değil (ya da ağ hatası; ikisi de "yetkisiz"dir).
   *  var      → oturum açık.
   */
  durum: 'okunuyor' | 'yok' | 'var'
  kullanici: OturumKullanicisi | null
  /** JWT bitiş anı (ms). Oturum süresi uyarısı bunu kullanır. */
  biter: number | null
  yenile: () => Promise<void>
}

const Baglam = createContext<OturumDurumu>({
  durum: 'okunuyor',
  kullanici: null,
  biter: null,
  yenile: async () => {},
})

export const useOturum = (): OturumDurumu => useContext(Baglam)

type MeYaniti = { user?: OturumKullanicisi | null; exp?: number }

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [durum, setDurum] = useState<'okunuyor' | 'yok' | 'var'>('okunuyor')
  const [kullanici, setKullanici] = useState<OturumKullanicisi | null>(null)
  const [biter, setBiter] = useState<number | null>(null)
  const sokulduRef = useRef(false)

  const oku = useCallback(async () => {
    try {
      const yanit = await fetch('/api/users/me', {
        credentials: 'include',
        /* Oturum KULLANICIYA ÖZELDİR; bir ara katman bu yanıtı önbelleğe
           alırsa bir kullanıcının kimliği başkasına gösterilir. */
        cache: 'no-store',
      })
      if (!yanit.ok) throw new Error('yetkisiz')

      const govde = (await yanit.json()) as MeYaniti
      if (sokulduRef.current) return

      if (govde?.user) {
        setKullanici(govde.user)
        setBiter(typeof govde.exp === 'number' ? govde.exp * 1000 : null)
        setDurum('var')
      } else {
        setKullanici(null)
        setBiter(null)
        setDurum('yok')
      }
    } catch {
      /*
        AĞ HATASI "OTURUM YOK" SAYILIR — güvenli taraf.
        Tersini varsaymak, bağlantı koptuğunda başlıkta "Çıkış Yap" gösterip
        kullanıcıya oturumu varmış gibi davranırdı; tıkladığı her korumalı
        bağlantı 403 dönerdi.
      */
      if (sokulduRef.current) return
      setKullanici(null)
      setBiter(null)
      setDurum('yok')
    }
  }, [])

  useEffect(() => {
    sokulduRef.current = false
    void oku()
    return () => {
      sokulduRef.current = true
    }
  }, [oku])

  const deger = useMemo<OturumDurumu>(
    () => ({ durum, kullanici, biter, yenile: oku }),
    [durum, kullanici, biter, oku],
  )

  return <Baglam.Provider value={deger}>{children}</Baglam.Provider>
}

export default SessionProvider
