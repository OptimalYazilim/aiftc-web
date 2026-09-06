import { NextResponse } from 'next/server'

/**
 * SAĞLIK KONTROLÜ  (Docker HEALTHCHECK / ters vekil)
 * ============================================================================
 * Konteyner orkestrasyonu "bu örnek trafik alabilir mi?" sorusunu ucuz bir
 * istekle sormalıdır. Sağlık kontrolü bir sayfaya (`/tr`) yapılsaydı her
 * denemede tam bir sunucu bileşeni ağacı çizilir ve veritabanı sorgulanırdı —
 * 30 saniyede bir, sonsuza kadar.
 *
 * BİLGİ SIZDIRMAZ — BİLİNÇLİ
 * Sürüm, derleme kimliği, ortam adı veya bağımlılık listesi DÖNMEZ. Bu uç
 * kimlik doğrulaması olmadan erişilebilir olduğundan, saldırgana sürüm bilgisi
 * vermek bilinen açıkları hedeflemesini kolaylaştırırdı.
 *
 * VERİTABANINI YOKLAMAZ — BİLİNÇLİ
 * Yalnızca "Node süreci ayakta ve istek işleyebiliyor mu" sorusunu yanıtlar.
 * Veritabanı kontrolü eklenseydi, geçici bir bağlantı dalgalanması sağlıklı
 * konteynerin öldürülüp yeniden başlatılmasına yol açardı; bu da kesintiyi
 * uzatır. Veritabanının sağlığı compose'da `db` servisinin kendi
 * `pg_isready` kontrolüyle izlenir.
 * ============================================================================
 */
export const dynamic = 'force-dynamic'

export const GET = () => NextResponse.json({ status: 'ok' }, { status: 200 })
