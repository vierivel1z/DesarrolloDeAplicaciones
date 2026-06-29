import api from './hb_api'

export const getCarteraMora = async () => {
    const res = await api.get('/mora/cartera')
    return res.data
}

export const ejecutarEodMora = async () => {
    const res = await api.post('/mora/cron/eod')
    return res.data
}

export const registrarGestionMora = async (data) => {
    const res = await api.post('/mora/gestiones', data)
    return res.data
}

export const aplicarTransicionMora = async (pkcuentacredito, tipo) => {
    const res = await api.post('/mora/transicion', { pkcuentacredito, tipo_transicion: tipo })
    return res.data
}
