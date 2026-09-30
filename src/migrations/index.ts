import * as migration_20260903_172619_ilk_surum from './20260903_172619_ilk_surum';
import * as migration_20260903_200613_anasayfa_menu_ve_durum_enum from './20260903_200613_anasayfa_menu_ve_durum_enum';
import * as migration_20260905_213907_kutuphane_media_ve_polimorfik_iliskiler from './20260905_213907_kutuphane_media_ve_polimorfik_iliskiler';
import * as migration_20260905_235038_sanal_sinif_odalari from './20260905_235038_sanal_sinif_odalari';
import * as migration_20260906_004002_form_gonderimleri from './20260906_004002_form_gonderimleri';
import * as migration_20260906_114030_mevcut_sema_senkronu from './20260906_114030_mevcut_sema_senkronu';
import * as migration_20260906_114957_kutuphane_kunye_alanlari from './20260906_114957_kutuphane_kunye_alanlari';
import * as migration_20260907_164936_sayfa_blok_basliklari from './20260907_164936_sayfa_blok_basliklari';
import * as migration_20260907_192905_commerce_abonelik_ve_teklifler from './20260907_192905_commerce_abonelik_ve_teklifler';
import * as migration_20260926_122952_edevlet_subject from './20260926_122952_edevlet_subject';
import * as migration_20260928_061412_registrations from './20260928_061412_registrations';
import * as migration_20260928_061500_registrations_varsayilan_ve_veri from './20260928_061500_registrations_varsayilan_ve_veri';
import * as migration_20260930_091923_edevlet_vatandas_anahtari from './20260930_091923_edevlet_vatandas_anahtari';
import * as migration_20260930_092850_basvuru_onay_epostasi from './20260930_092850_basvuru_onay_epostasi';
import * as migration_20260930_100600_kutuphane_kategorileri from './20260930_100600_kutuphane_kategorileri';
import * as migration_20260930_101849_daire_bazli_erisim from './20260930_101849_daire_bazli_erisim';
import * as migration_20260930_103718_egitim_basvuru_sorulari from './20260930_103718_egitim_basvuru_sorulari';
import * as migration_20260930_110025_konaklama_on_basvurusu from './20260930_110025_konaklama_on_basvurusu';

export const migrations = [
  {
    up: migration_20260903_172619_ilk_surum.up,
    down: migration_20260903_172619_ilk_surum.down,
    name: '20260903_172619_ilk_surum',
  },
  {
    up: migration_20260903_200613_anasayfa_menu_ve_durum_enum.up,
    down: migration_20260903_200613_anasayfa_menu_ve_durum_enum.down,
    name: '20260903_200613_anasayfa_menu_ve_durum_enum',
  },
  {
    up: migration_20260905_213907_kutuphane_media_ve_polimorfik_iliskiler.up,
    down: migration_20260905_213907_kutuphane_media_ve_polimorfik_iliskiler.down,
    name: '20260905_213907_kutuphane_media_ve_polimorfik_iliskiler',
  },
  {
    up: migration_20260905_235038_sanal_sinif_odalari.up,
    down: migration_20260905_235038_sanal_sinif_odalari.down,
    name: '20260905_235038_sanal_sinif_odalari',
  },
  {
    up: migration_20260906_004002_form_gonderimleri.up,
    down: migration_20260906_004002_form_gonderimleri.down,
    name: '20260906_004002_form_gonderimleri',
  },
  {
    up: migration_20260906_114030_mevcut_sema_senkronu.up,
    down: migration_20260906_114030_mevcut_sema_senkronu.down,
    name: '20260906_114030_mevcut_sema_senkronu',
  },
  {
    up: migration_20260906_114957_kutuphane_kunye_alanlari.up,
    down: migration_20260906_114957_kutuphane_kunye_alanlari.down,
    name: '20260906_114957_kutuphane_kunye_alanlari',
  },
  {
    up: migration_20260907_164936_sayfa_blok_basliklari.up,
    down: migration_20260907_164936_sayfa_blok_basliklari.down,
    name: '20260907_164936_sayfa_blok_basliklari',
  },
  {
    up: migration_20260907_192905_commerce_abonelik_ve_teklifler.up,
    down: migration_20260907_192905_commerce_abonelik_ve_teklifler.down,
    name: '20260907_192905_commerce_abonelik_ve_teklifler',
  },
  {
    up: migration_20260926_122952_edevlet_subject.up,
    down: migration_20260926_122952_edevlet_subject.down,
    name: '20260926_122952_edevlet_subject',
  },
  {
    up: migration_20260928_061412_registrations.up,
    down: migration_20260928_061412_registrations.down,
    name: '20260928_061412_registrations'
  },
  {
    up: migration_20260928_061500_registrations_varsayilan_ve_veri.up,
    down: migration_20260928_061500_registrations_varsayilan_ve_veri.down,
    name: '20260928_061500_registrations_varsayilan_ve_veri'
  },
  {
    up: migration_20260930_091923_edevlet_vatandas_anahtari.up,
    down: migration_20260930_091923_edevlet_vatandas_anahtari.down,
    name: '20260930_091923_edevlet_vatandas_anahtari'
  },
  {
    up: migration_20260930_092850_basvuru_onay_epostasi.up,
    down: migration_20260930_092850_basvuru_onay_epostasi.down,
    name: '20260930_092850_basvuru_onay_epostasi'
  },
  {
    up: migration_20260930_100600_kutuphane_kategorileri.up,
    down: migration_20260930_100600_kutuphane_kategorileri.down,
    name: '20260930_100600_kutuphane_kategorileri'
  },
  {
    up: migration_20260930_101849_daire_bazli_erisim.up,
    down: migration_20260930_101849_daire_bazli_erisim.down,
    name: '20260930_101849_daire_bazli_erisim'
  },
  {
    up: migration_20260930_103718_egitim_basvuru_sorulari.up,
    down: migration_20260930_103718_egitim_basvuru_sorulari.down,
    name: '20260930_103718_egitim_basvuru_sorulari'
  },
  {
    up: migration_20260930_110025_konaklama_on_basvurusu.up,
    down: migration_20260930_110025_konaklama_on_basvurusu.down,
    name: '20260930_110025_konaklama_on_basvurusu'
  },
];
