export function createMapLink(address: string) {
  return `https://yandex.ru/maps/?text=${encodeURIComponent(address)}`
}
