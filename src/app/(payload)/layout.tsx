/* Payload admin paneli kok layout'u. Bu dosya Payload tarafindan uretilir;
   elle degistirmeyin (importMap yeniden uretildiginde uzerine yazilabilir). */
import type { ServerFunctionClient } from 'payload'
import config from '@payload-config'
import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts'
import { Inter } from 'next/font/google'
import React from 'react'

import { importMap } from './admin/importMap.js'

import '@payloadcms/next/css'

/* Kurumsal stil katmanı. SIRA ÖNEMLİDİR: Payload'ın kendi CSS'inden SONRA
   yüklenmeli, aksi halde kuralları ezilir. Bkz. admin-theme.css */
import './admin-theme.css'

/* Sitenin yazı tipiyle aynı (Inter). `next/font` dosyayı BUILD sırasında
   indirip kendi sunucumuzdan verir; çalışma anında Google'a istek gitmez
   (KVKK — sitede de aynı gerekçe). Değişken <html>'e sınıf olarak bağlanır,
   admin-theme.css `--font-body`'yi ondan kurar. Kiril alt kümesi RU arayüz
   için zorunludur. */
const inter = Inter({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
})

type Args = {
  children: React.ReactNode
}

const serverFunction: ServerFunctionClient = async function (args) {
  'use server'
  return handleServerFunctions({ ...args, config, importMap })
}

const Layout = ({ children }: Args) => (
  <RootLayout
    config={config}
    htmlProps={{ className: inter.variable }}
    importMap={importMap}
    serverFunction={serverFunction}
  >
    {children}
  </RootLayout>
)

export default Layout
