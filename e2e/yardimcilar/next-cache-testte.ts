/**
 * `next/cache` — TEST SÜRECİ İÇİN SAHTE MODÜL
 * ============================================================================
 * Yalnızca `tsconfig.e2e.json` üzerinden Playwright sürecinde devreye girer.
 * Gerekçe orada ayrıntılı yazılıdır.
 *
 * ---------------------------------------------------------------------------
 * NEDEN SESSİZ BİR NO-OP DEĞİL
 * ---------------------------------------------------------------------------
 * Tohumlama ve temizlik her yazmada `context.skipRevalidate = true` geçer, bu
 * yüzden bu fonksiyonlar ÇAĞRILMAMALIDIR. Sessizce hiçbir şey yapan bir sahte
 * modül, o bayrağı geçirmeyi unutan gelecekteki bir tohumu gizlerdi.
 *
 * Bunun yerine açıkça patlar: gerçek `next/cache` de istek bağlamı dışında
 * çağrıldığında hata verir — yani bu davranış üretimdekiyle AYNI yöndedir,
 * yalnızca hata mesajı okunabilirdir.
 * ============================================================================
 */
const hata = (ad: string): never => {
  throw new Error(
    `[e2e] ${ad}() test sürecinde çağrıldı. Payload yazma işlemlerine ` +
      '`context: { skipRevalidate: true }` geçilmelidir (bkz. e2e/yardimcilar/tohum.ts).',
  )
}

export const revalidatePath = (): never => hata('revalidatePath')
export const revalidateTag = (): never => hata('revalidateTag')
export const unstable_cache = (): never => hata('unstable_cache')
export const unstable_noStore = (): never => hata('unstable_noStore')
