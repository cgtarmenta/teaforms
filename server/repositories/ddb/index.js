import { configureDynamoose } from '../../db/dynamoose.js'
import { formsDdbRepo } from './forms.js'
import { episodesDdbRepo } from './episodes.js'

await configureDynamoose()

export default {
  backend: 'ddb',
  forms: formsDdbRepo,
  episodes: episodesDdbRepo,
}

