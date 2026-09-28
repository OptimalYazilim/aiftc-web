import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * VARSAYILAN + VERİ DÖNÜŞÜMÜ — ŞEMA GÖÇÜNDEN AYRI, BİLİNÇLİ
 * ============================================================================
 * Bir önceki göç `applicationTarget.type` enum'una 'registration' değerini
 * EKLER; bu göç onu KULLANIR. İkisi tek işlemde olamaz — Postgres aynı işlem
 * içinde eklenen enum değerinin kullanılmasını reddeder ("unsafe use of new
 * value"); ölçüldü, önceki göçün docblock'unda.
 *
 * ---------------------------------------------------------------------------
 * VERİ DÖNÜŞÜMÜ: 'contact' → 'registration'  — NEDEN
 * ---------------------------------------------------------------------------
 * Kurumun kararı: başvuru ve katılımcı süreci PANELDE yürütülür, dış portal
 * yoktur. Bu karardan önce alanın varsayılanı 'contact' idi ve pratikte her
 * eğitim o değerle kaydedilmişti — editörün bilinçli seçimi değil, formun
 * boş bırakılmış hâliydi. 'contact' artık "başvuru almıyoruz, iletişim
 * birimine yazın" anlamına geliyor; mevcut eğitimleri o anlamda bırakmak,
 * yayındaki HER eğitimin başvuru düğmesini sessizce iletişim sayfasına
 * çevirmek olurdu.
 *
 * Dolayısıyla mevcut 'contact' kayıtları yeni varsayılana çevrilir. Editör
 * "gerçekten yalnızca iletişim" isteyen bir eğitimi panelden yeniden
 * 'contact' yapabilir; bu göç bir kez koşar, sonrasına karışmaz.
 *
 * Sürüm tablosu (`_training_programs_v`) da çevrilir: taslak/yayın geçmişi
 * aynı enum'u paylaşır ve orada 'contact' kalsa eski bir sürümü geri yükleyen
 * editör alanı sessizce eski anlamına döndürmüş olurdu.
 *
 * DOWN: varsayılan 'contact'a döner ve 'registration' değerleri 'contact'a
 * çevrilir — ÖNCEKİ göçün down'u enum'u 'registration' olmadan yeniden
 * kurarken satırlarda o değer kalırsa cast hatasıyla düşerdi.
 * ============================================================================
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "training_programs" ALTER COLUMN "application_target_type" SET DEFAULT 'registration';
  ALTER TABLE "_training_programs_v" ALTER COLUMN "version_application_target_type" SET DEFAULT 'registration';
  UPDATE "training_programs" SET "application_target_type" = 'registration' WHERE "application_target_type" = 'contact';
  UPDATE "_training_programs_v" SET "version_application_target_type" = 'registration' WHERE "version_application_target_type" = 'contact';`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  UPDATE "training_programs" SET "application_target_type" = 'contact' WHERE "application_target_type" = 'registration';
  UPDATE "_training_programs_v" SET "version_application_target_type" = 'contact' WHERE "version_application_target_type" = 'registration';
  ALTER TABLE "training_programs" ALTER COLUMN "application_target_type" SET DEFAULT 'contact';
  ALTER TABLE "_training_programs_v" ALTER COLUMN "version_application_target_type" SET DEFAULT 'contact';`)
}
