import { writable, derived } from 'svelte/store'
import { foodbanks as initialFoodbanks, userAddresses } from './data'

export const foodbanks = writable(initialFoodbanks)
export const addresses = writable(userAddresses)

export const requests = writable([])

export const selectedFoodbank = derived(foodbanks, ($fbs) => $fbs[0] ?? null)
