import type { Design } from '../../interface/design'
import PageRoot from './PageRoot.vue'
import CoverPage from '../standard/CoverPage.vue'
import EndPage from '../standard/EndPage.vue'

const design: Design = { Root: PageRoot, CoverPage, EndPage }
export default design
