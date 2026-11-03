import type { Component } from 'vue'

export interface HeaderData {
  title?: string
  section?: string
  organization?: string
  classification?: string
  options?: Record<string, unknown>
}

export interface FooterData {
  department?: string
  documentId?: string
  revision?: string
  pageNumber?: number | string
  options?: Record<string, unknown>
}

export interface GeneralPageData {
  header: HeaderData
  footer: FooterData
  takeaway?: string | boolean
  chrome: { showHeader: boolean; showFooter: boolean }
}

export interface CoverPageData {
  title?: string
  subtitle?: string
  author?: string
  date?: string
  image?: string
  imageAlt?: string
  imageFit?: string
  imagePosition?: string
}

export interface EndPageData {
  title?: string
  subtitle?: string
  note?: string
}

/** Visual implementation contract. Slide/layout data is normalized by the kit before reaching themes. */
export interface Design {
  Root: Component
  /** Optional full composition override; receives GeneralPageData as `page` and body content as default slot. */
  DefaultPage?: Component
  /** Optional reusable parts consumed by the standard page composition. */
  Header?: Component
  Body?: Component
  Footer?: Component
  CoverPage?: Component
  EndPage?: Component
}
