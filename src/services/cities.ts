
const BaseUrl = "https://geo.api.gouv.fr/communes"
class CitiesService {
    async getCities() {
        const response = await fetch(`${BaseUrl}?fields=nom,codesPostaux`)
        const data = await response.json()
        return data
    }
    async getCityByName(name: string) {
        const response = await fetch(`${BaseUrl}?nom=${name}&fields=nom,codesPostaux&limit=10&boost=population`)
        const data = await response.json()
        return data
    }

}

export default new CitiesService()