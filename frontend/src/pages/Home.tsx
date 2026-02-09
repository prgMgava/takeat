import { Link } from 'react-router-dom';
import { Search, Utensils, Clock, Star } from 'lucide-react';

export default function Home() {
  return (
    <div>

      <section className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl font-bold mb-6">
              Sua comida favorita, entregue rápido
            </h1>
            <p className="text-xl mb-8 text-orange-100">
              Descubra os melhores restaurantes da sua região e peça com apenas alguns cliques.
            </p>
            <Link
              to="/restaurants"
              className="inline-flex items-center bg-white text-orange-500 px-8 py-3 rounded-lg font-semibold hover:bg-orange-50 transition-colors"
            >
              <Search className="h-5 w-5 mr-2" />
              Ver Restaurantes
            </Link>
          </div>
        </div>
      </section>


      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Como funciona</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Escolha</h3>
              <p className="text-gray-600">
                Navegue pelos restaurantes e escolha seus pratos favoritos.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Utensils className="h-8 w-8 text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Peça</h3>
              <p className="text-gray-600">
                Confirme seu pedido e escolha a forma de pagamento.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Receba</h3>
              <p className="text-gray-600">
                Acompanhe seu pedido em tempo real e receba em casa.
              </p>
            </div>
          </div>
        </div>
      </section>


      <section className="py-16 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Tem um restaurante?</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Cadastre-se como parceiro e alcance milhares de clientes na sua região.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center bg-orange-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
          >
            Cadastrar Restaurante
          </Link>
        </div>
      </section>
    </div>
  );
}
