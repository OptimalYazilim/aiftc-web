/**
 * KATALOG SORGU PARAMETRELERİ
 * ============================================================================
 * Konu filtresini adresten önseçen parametre:
 *   /tr/egitim-programlari?konu=entegre-orman-yangini-yonetimi
 * Footer'daki "Öne Çıkan Başlıklar" sütunu bu adresleri üretir; bağlantı
 * dekoratif değildir, katalogu gerçekten filtreler.
 *
 * NEDEN AYRI DOSYA
 * Bu sabit hem SUNUCU bileşeninden (SiteFooter) hem de İSTEMCİ bileşeninden
 * (TrainingCatalog) okunur. `'use client'` işaretli bir modülden sabit
 * almak, o modülü sunucu grafiğine de sokar ve modül grafiğinin bozulmasına
 * yol açabilir. Aynı ders `lib/contactForm.ts`'te de yaşandı: sınır
 * işaretli modüller değer paylaşımı için kullanılmaz, yalnızca bileşen
 * dışa aktarır.
 * ============================================================================
 */
export const TOPIC_PARAM = 'konu'
