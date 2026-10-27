import { notFound } from '../../shared/errors.ts'
import { profilesRepository, type ProfileUpdate } from './profiles.repository.ts'

const profileNotFound = () => notFound('Profile não encontrado', 'PROFILE_NOT_FOUND')

export const profilesService = {
  async list(cd_user: number, withFavorites: boolean) {
    return profilesRepository.listByUser(cd_user, withFavorites)
  },

  async getById(cd_user: number, cd_profile: number) {
    const profile = await profilesRepository.findOwned(cd_user, cd_profile)
    if (!profile) throw profileNotFound()
    return profile
  },

  async create(cd_user: number, nm_profile: string) {
    return profilesRepository.create(cd_user, nm_profile.trim())
  },

  async update(cd_user: number, cd_profile: number, input: ProfileUpdate) {
    const data: ProfileUpdate = {}
    if (input.nm_profile !== undefined) data.nm_profile = input.nm_profile.trim()

    const profile = await profilesRepository.update(cd_user, cd_profile, data)
    if (!profile) throw profileNotFound()
    return profile
  },

  // Os favorites do profile são removidos pelo ON DELETE CASCADE
  async remove(cd_user: number, cd_profile: number) {
    if (!(await profilesRepository.delete(cd_user, cd_profile))) throw profileNotFound()
  },
}
