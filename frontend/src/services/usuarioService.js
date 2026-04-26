import api from './api';

const usuarioService = {
  listar: async () => {
    const { data } = await api.get('/usuarios');
    return data.data || [];
  },
};

export default usuarioService;
