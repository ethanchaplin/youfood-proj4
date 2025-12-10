import { writable, derived } from 'svelte/store'
import type { Foodbank, Address } from './data'
import { foodbanks as initialFoodbanks, userAddresses } from './data'

export const foodbanks = writable<Foodbank[]>(initialFoodbanks)
export const addresses = writable<Address[]>(userAddresses)

export type RequestItem = {
  itemId: string
  name: string
  quantity: number
}

export type RequestRecord = {
  id: string
  foodbankId: string
  foodbankName: string
  name: string
  phone: string
  addressId: string
  addressLabel: string
  addressFull: string
  notes?: string
  items: RequestItem[]
  createdAt: string
}

export const requests = writable<RequestRecord[]>([])

export const selectedFoodbank = derived(foodbanks, ($fbs) => $fbs[0] ?? null)
