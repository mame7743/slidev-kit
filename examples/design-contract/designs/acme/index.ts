import type { Design } from 'slidev-kit/interface/design.ts'
import PageRoot from './PageRoot.vue'
import DefaultPage from './DefaultPage.vue'
import Header from './Header.vue'
import Footer from './Footer.vue'

const design: Design = { Root: PageRoot, DefaultPage, Header, Footer }
export default design
