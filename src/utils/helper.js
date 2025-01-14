import { regionFull, regionCities, regionAreas } from '../formatted'
import {
  LEVEL_LIST,
  PROVINCE_KEY,
  CITY_LEVEL, AREA_LEVEL, TOWN_LEVEL
} from '../constants'

export function generateComponentName (typeName) {
  if (!typeName) return
  return `r-${typeName}`
}

/**
 * 根据省读取城市列表
 *
 * @param {object} province - 省
 * @returns {object[]} - 城市列表
 */
export function loadCity (province) {
  if (!province || !Object.keys(province).length) return []

  const list = regionCities.filter(val => {
    const num = Number.parseInt(province.key)
    return (val.key - num) < 1e4 && (val.key % num) < 1e4
  })
  // Municipalities directly under the central government
  return list.length ? list : [province]
}

/**
 * 根据城市读取区/县列表
 *
 * @param {object} city - 城市
 * @returns {object[]} 区/县列表
 */
export function loadArea (city) {
  if (!city || !Object.keys(city).length) return []

  const cityKey = Number.parseInt(city.key)
  const isNotProvince = cityKey % 1e4
  const calcNum = isNotProvince ? 100 : 1e4
  const list = regionAreas.filter(val => {
    return (val.key - cityKey) < calcNum && val.key % cityKey < calcNum
  })
  // Prefecture-level city
  return list.length ? list : [city]
}

function townDataPath (areaKey) {
  return `../town/${areaKey}.json`
}

/**
 * 根据区/县数据读取乡/镇列表
 *
 * @param {object} area - 区/县
 * @returns {object[]} 乡/镇列表
 */
export async function loadTown (area) {
  if (!area || !Object.keys(area).length) return []

  try {
    const { default: data } = await import(townDataPath(area.key))
    // console.log(towns)
    if (!data || typeof data !== 'object') {
      return []
    }

    return Object
      .entries(data)
      .map(([key, value]) => ({ key, value }))
  } catch (e) {
    console.warn(`The "${area.value}" area have no towns data.`)
    return []
  }
}

/**
 * Get level list loader
 *
 * @export
 * @param {number} level
 * @returns
 */
export function getLoader (level) {
  switch (level) {
    case CITY_LEVEL: return loadCity
    case AREA_LEVEL: return loadArea
    case TOWN_LEVEL: return loadTown
  }
}

/**
 * Get available region levels
 *
 * @param {boolean} city
 * @param {boolean} area
 * @param {boolean} town
 */
export function availableLevels () {
  const result = [PROVINCE_KEY]
  const switches = Array.from(arguments)

  for (let i = 0; i < switches.length; i++) {
    if (switches[i]) {
      result.push(LEVEL_LIST[i + 1])
    } else {
      return result
    }
  }

  return result
}

/**
 * 校验输入数据模型格式有效性
 *
 * @param {object} model - 数据模型
 * @returns {boolean} 检查结果
 */
export function validModel (model) {
  return Boolean(
    model &&
    Object.keys(model).length &&
    LEVEL_LIST.every(val => val in model)
  )
}

/**
 * 根据 key 获得模型数据
 *
 * @param {string} key
 * @returns {object} 模型数据
 */
export const getDetail = key => {
  return regionFull.find(val => val.key === key)
}

/**
 * 检查初始化数据是否与当前选中数据相同
 *
 * @param {string[]} keys - 选中城市的键值列表
 * @param {{ key: string, value: string }[]} cities - 选中城市的模型列表
 * @returns {boolean}
 */
export function keysEqualModels (keys, models) {
  if (keys.length === models.length) {
    // 均为空数组
    if (!keys.length) return true
    return models.every(val => keys.includes(val.key))
  } else {
    return false
  }
}

export function isSelected (item, selectedItems) {
  if (!item || !selectedItems.length) return false
  return selectedItems.some(val => val.key === item.key)
}

export function isChrome () {
  return navigator.vendor !== undefined && navigator.vendor.indexOf('Google') !== -1
}

export function isEdge () {
  return navigator.userAgent.indexOf('Edge') >= 0
}

export function inputFocus (input) {
  if (!input) return
  /**
   * fixed the page will scroll to top when open drop down list and set input focus
   * that.$refs.search.focus({preventScroll:true})
   * only work on Chrome and EDGE
   */
  if (isChrome() || isEdge()) {
    input.focus({ preventScroll: true })
  } else {
    const x = window.pageXOffset
    const y = window.pageYOffset
    input.focus()
    if (window.pageYOffset !== y) {
      setTimeout(() => { window.scrollTo(x, y) }, 0)
    }
  }
}
