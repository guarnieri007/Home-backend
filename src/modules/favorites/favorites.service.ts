import { db } from '../../db/index.ts'
import { badRequest, notFound } from '../../shared/errors.ts'
import { profilesRepository } from '../profiles/profiles.repository.ts'
import { fetchFavicon } from './favicon.ts'
import { favoritesRepository, type FavoriteUpdate, type NewFavorite } from './favorites.repository.ts'

const favoriteNotFound = () => notFound('Favorito não encontrado', 'FAVORITE_NOT_FOUND')

// O profile de destino precisa existir e ser do usuário logado
async function assertProfileOwned(cd_user: number, cd_profile: number) {
  if (!(await profilesRepository.findOwned(cd_user, cd_profile))) {
    throw notFound('Profile não encontrado', 'PROFILE_NOT_FOUND')
  }
}

export const favoritesService = {
  async list(cd_user: number, cd_profile?: number) {
    return favoritesRepository.listByUser(cd_user, cd_profile)
  },

  async getById(cd_user: number, cd_favorite: number) {
    const favorite = await favoritesRepository.findOwned(cd_user, cd_favorite)
    if (!favorite) throw favoriteNotFound()
    return favorite
  },

  async create(cd_user: number, input: Omit<NewFavorite, 'icone'> & { icone?: string }) {
    await assertProfileOwned(cd_user, input.cd_profile)

    // Ícone personalizado tem prioridade; sem ele, busca o favicon do site
    const icone = input.icone ?? (await fetchFavicon(input.url))

    // Novo favorito entra no fim da lista do profile
    return db.transaction(async (tx) => {
      const sort_order = await favoritesRepository.nextSortOrder(input.cd_profile, tx)
      return favoritesRepository.create({ ...input, icone, sort_order }, tx)
    })
  },

  async update(cd_user: number, cd_favorite: number, input: FavoriteUpdate) {
    const atual = await favoritesRepository.findOwned(cd_user, cd_favorite)
    if (!atual) throw favoriteNotFound()

    return db.transaction(async (tx) => {
      const data: FavoriteUpdate = { ...input }
      // Movido para outro profile do mesmo usuário: vai para o fim da lista de lá
      if (input.cd_profile !== undefined && input.cd_profile !== atual.cd_profile) {
        await assertProfileOwned(cd_user, input.cd_profile)
        data.sort_order = await favoritesRepository.nextSortOrder(input.cd_profile, tx)
      }

      const favorite = await favoritesRepository.update(cd_user, cd_favorite, data, tx)
      if (!favorite) throw favoriteNotFound()
      return favorite
    })
  },

  // Recebe todos os favoritos do profile na nova ordem e regrava as posições
  async reorder(cd_user: number, cd_profile: number, cd_favorites: number[]) {
    await assertProfileOwned(cd_user, cd_profile)

    await db.transaction(async (tx) => {
      const atuais = await favoritesRepository.listIdsByProfile(cd_profile, tx)
      const mesmaLista = atuais.length === cd_favorites.length && cd_favorites.every((id) => atuais.includes(id))
      if (!mesmaLista) {
        throw badRequest('A lista precisa conter exatamente os favoritos do profile', 'ORDER_MISMATCH')
      }
      for (const [posicao, cd_favorite] of cd_favorites.entries()) {
        await favoritesRepository.setSortOrder(cd_favorite, posicao, tx)
      }
    })

    return favoritesRepository.listByUser(cd_user, cd_profile)
  },

  async remove(cd_user: number, cd_favorite: number) {
    if (!(await favoritesRepository.delete(cd_user, cd_favorite))) throw favoriteNotFound()
  },
}
