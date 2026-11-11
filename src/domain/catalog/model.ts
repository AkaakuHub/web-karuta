export interface CatalogEntry {
  id: string;
  title: string;
  number: string;
  artists: readonly string[];
  releasedOn: string | null;
  credits: readonly { role: string; name: string }[];
  packs: readonly number[];
  series: readonly { id: string; name: string; color: string }[];
  audioSources: readonly { title: string; url: string }[];
  links: readonly { name: string; url: string }[];
  releases: readonly {
    id: string;
    title: string;
    edition: string | null;
    releasedOn: string | null;
    url: string;
    recordings: readonly { id: string; title: string; artist: string | null }[];
  }[];
  videos: readonly { id: string; title: string; url: string }[];
}

export interface CatalogImage {
  id: string;
  title: string;
  edition: string | null;
  sourceUrl: string;
}
