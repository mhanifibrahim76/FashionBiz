'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export function SortSelect({ currentSort }: { currentSort: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleSortChange(sort: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('sort', sort)
    router.push(`?${params.toString()}`)
  }

  return (
    <select
      className="select-compact"
      defaultValue={currentSort}
      onChange={(e) => handleSortChange(e.target.value)}
    >
      <option value="revenue">Revenue</option>
      <option value="profit">Profit</option>
      <option value="units">Units Sold</option>
      <option value="margin">Margin %</option>
    </select>
  )
}
