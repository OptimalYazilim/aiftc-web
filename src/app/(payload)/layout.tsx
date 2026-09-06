/* Payload admin paneli kok layout'u. Bu dosya Payload tarafindan uretilir;
   elle degistirmeyin (importMap yeniden uretildiginde uzerine yazilabilir). */
import type { ServerFunctionClient } from 'payload'
import config from '@payload-config'
import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts'
import React from 'react'

import { importMap } from './admin/importMap.js'

import '@payloadcms/next/css'

/* Kurumsal stil katmanı. SIRA ÖNEMLİDİR: Payload'ın kendi CSS'inden SONRA
   yüklenmeli, aksi halde kuralları ezilir. Bkz. admin-theme.css */
import './admin-theme.css'

type Args = {
  children: React.ReactNode
}

const serverFunction: ServerFunctionClient = async function (args) {
  'use server'
  return handleServerFunctions({ ...args, config, importMap })
}

const Layout = ({ children }: Args) => (
  <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
    {children}
  </RootLayout>
)

export default Layout
