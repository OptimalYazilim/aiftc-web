import * as migration_20260903_172619_ilk_surum from './20260903_172619_ilk_surum';
import * as migration_20260903_200613_anasayfa_menu_ve_durum_enum from './20260903_200613_anasayfa_menu_ve_durum_enum';
import * as migration_20260905_213907_kutuphane_media_ve_polimorfik_iliskiler from './20260905_213907_kutuphane_media_ve_polimorfik_iliskiler';
import * as migration_20260905_235038_sanal_sinif_odalari from './20260905_235038_sanal_sinif_odalari';

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
    name: '20260905_235038_sanal_sinif_odalari'
  },
];
