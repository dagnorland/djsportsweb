import { Artist } from "./artist";
import { Track } from "./track";
import { SimplifiedAlbum } from "./album";
import { SimplifiedEpisode } from "./episode";
import { SimplifiedShow } from "./show";

/**
 * All the spotify element types
 */
export type SpotifyType =
  | "user"
  | "episode"
  | "playlist"
  | "show"
  | "track"
  | "album"
  | "artist";

/**
 * All the spotify search types.
 */
export type SearchType = "album" | "artist" | "track" | "show" | "episode";

/**
 * The DJ playlist types available in the application.
 */
export type DJPlaylistType = 
  | "none"
  | "hotspot" 
  | "match"
  | "funStuff"
  | "preMatch";

/**
 * The spotify object containing the details of an image.
 *
 * @property height - The image height in pixels. If unknown: null or not returned.
 * @property url - The source URL of the image.
 * @property width - The image width in pixels. If unknown: null or not returned.
 */
export interface Image {
  /** The image height in pixels. If unknown: null or not returned. */
  height: number | null;
  /** The source URL of the image. */
  url: string;
  /** The image width in pixels. If unknown: null or not returned. */
  width: number | null;
}

/**
 * The external urls object which contains the spotify url within it.
 *
 * @property spotify - The Spotify URL for the object.
 */
export interface ExternalUrl {
  /** The Spotify URL for the object. */
  spotify: string;
}

/**
 * The external ids object which contains the spotify id within it.
 *
 * @property isrc - International Standard Recording Code
 * @property ean - International Article Number
 * @property upc - Universal Product Code
 */
export interface ExternalID {
  /** International Article Number */
  ean: string;
  /** International Standard Recording Code */
  isrc: string;
  /** Universal Product Code */
  upc: string;
}

/**
 * The paging object is a form of collection of items from the spotify api.
 *
 * @property href - A link to the Web API endpoint returning the full result of the request.
 * @property items - The requested data.
 * @property limit - The maximum number of items in the response (as set in the query or by default).
 * @property next - URL to the next page of items. (null if none)
 * @property offset - The offset of the items returned (as set in the query or by default)
 * @property previous - URL to the previous page of items. (null if none)
 * @property total - The total number of items available to return.
 */
export interface Paging<T> {
  /** A link to the Web API endpoint returning the full result of the request. */
  href: string;
  /** The requested data. */
  items: T[];
  /** The maximum number of items in the response (as set in the query or by default). */
  limit: number;
  /** URL to the next page of items. (null if none) */
  next: string;
  /** The offset of the items returned (as set in the query or by default) */
  offset: number;
  /** URL to the previous page of items. (null if none) */
  previous: string;
  /** The total number of items available to return. */
  total: number;
}

/**
 * The copyright object contains the type and the name of copyright.
 *
 * @property text - The text of copyright.
 * @property type - The type of copyright.
 */
export interface Copyright {
  /** The text of copyright. */
  text: string;
  /** The type of copyright. */
  type: "C" | "P";
}

/**
 * The object containing the reason of restriction by the spotify api.
 * @property reason - The reason for the restriction.
 */
export interface Restriction {
  /** The reason for the restriction. */
  reason: "market" | "product" | "explicit";
}

/**
 * The error response sent by the spotify api during unusual status codes.
 *@property message - A short description of the cause of the error.
 *@property status - The HTTP status code (also returned in the response header; see Response Status Codes for more information).
 */
export interface ErrorResponse {
  /** A short description of the cause of the error. */
  message: string;
  /** The HTTP status code (also returned in the response header; see Response Status Codes for more information). */
  status: number;
}

/**
 * The object containing the saved elements and the timestamp when they were added.
 */
export type Saved<K extends SpotifyType, T> = { added_at: string } & Record<
  K,
  T
>;

/**
 * The object structure returned by the [/search] endpoint.
 * @property albums - The album search results.
 * @property artists - The artist search results.
 * @property playlists - The playlist search results.
 * @property tracks - The track search results.
 * @property shows - The show search results.
 * @see https://developer.spotify.com/documentation/web-api/reference/search
 */
export interface SearchContent {
  /** The episode search results. */
  episodes?: Paging<SimplifiedEpisode>;
  /** The show search results. */
  shows?: Paging<SimplifiedShow>;
  /** The track search results. */
  tracks?: Paging<Track>;
  /** The artists search results. */
  artists?: Paging<Artist>;
  /** the album search results. */
  albums?: Paging<SimplifiedAlbum>;
}
