import * as migration_20260903_172619_ilk_surum from './20260903_172619_ilk_surum';
import * as migration_20260903_200613_anasayfa_menu_ve_durum_enum from './20260903_200613_anasayfa_menu_ve_durum_enum';
import * as migration_20260905_213907_kutuphane_media_ve_polimorfik_iliskiler from './20260905_213907_kutuphane_media_ve_polimorfik_iliskiler';
import * as migration_20260905_235038_sanal_sinif_odalari from './20260905_235038_sanal_sinif_odalari';
import * as migration_20260906_004002_form_gonderimleri from './20260906_004002_form_gonderimleri';
import * as migration_20260906_114030_mevcut_sema_senkronu from './20260906_114030_mevcut_sema_senkronu';
import * as migration_20260906_114957_kutuphane_kunye_alanlari from './20260906_114957_kutuphane_kunye_alanlari';
import * as migration_20260907_164936_sayfa_blok_basliklari from './20260907_164936_sayfa_blok_basliklari';
import * as migration_20260907_192905_commerce_abonelik_ve_teklifler from './20260907_192905_commerce_abonelik_ve_teklifler';

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
    name: '20260907_192905_commerce_abonelik_ve_teklifler'
  },
];
