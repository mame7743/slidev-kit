import type { Design } from '../../interface/design'
import PageRoot from './PageRoot.vue'
import DefaultPage from '../standard/DefaultPage.vue'
import CoverPage from '../standard/CoverPage.vue'
import EndPage from '../standard/EndPage.vue'

const design: Design = { Root: PageRoot, DefaultPage, CoverPage, EndPage }
export default design
