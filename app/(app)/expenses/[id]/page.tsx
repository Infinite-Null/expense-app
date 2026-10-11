'use client'

import { use } from 'react'
import { ExpenseDetailClient } from './ExpenseDetailClient'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function ExpenseDetailPage({ params }: PageProps) {
  const { id } = use(params)
  return <ExpenseDetailClient id={id} />
}
