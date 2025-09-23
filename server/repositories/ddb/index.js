import { formsDdbRepo } from './forms.js'
import { episodesDdbRepo } from './episodes.js'

export default {
  backend: 'ddb',
  forms: formsDdbRepo,
  episodes: episodesDdbRepo,
}
