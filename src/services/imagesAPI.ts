const UNSPLASH_ACCESS_KEY = "i3ck9_TeX89MzzU2SpmFRgVKIVglu5rSyfycSyJy5-k";

export interface UnsplashImage {
    id: string;
    url_small: string;
    url_large: string;
}

export const ImagesServiceUnsplash = {
    async getFacadeImages(id: number): Promise<string> {
        try {
            const res = await fetch(
                `https://api.unsplash.com/search/photos?query=building+facade&per_page=10&client_id=${UNSPLASH_ACCESS_KEY}`
            );

            if (!res.ok) {
                console.warn(`Unsplash API Error: ${res.statusText}`);
                return "";
            }

            const data = await res.json();

            if (!data.results || data.results.length === 0) {
                return "";
            }

            const safeIndex = id % data.results.length;

            const images: UnsplashImage[] = data.results.map((photo: any) => ({
                id: photo.id,
                url_small: photo.urls.small,
                url_large: photo.urls.full,
            }));

            return images[safeIndex]?.url_small || "";
        } catch (error) {
            console.error("Error fetching Unsplash images:", error);
            return "";
        }
    }
};
