import { Outlet, Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Store, LogOut, Menu, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import OfflineQueueNotification from './OfflineQueueNotification';

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated, logout } = useAuthStore();

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const { items } = useCartStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <Store className="h-8 w-8 text-orange-500" />
              <span className="text-xl font-bold text-gray-900">Takeat</span>
            </Link>

            <nav className="hidden md:flex items-center space-x-6">
              <Link to="/restaurants" className="text-gray-600 hover:text-orange-500">
                Restaurantes
              </Link>
              {isAuthenticated ? (
                <>
                  <Link to="/orders" className="text-gray-600 hover:text-orange-500">
                    Meus Pedidos
                  </Link>
                  {(user?.role === 'RESTAURANT_OWNER' || user?.role === 'ADMIN') && (
                    <Link to="/dashboard" className="text-gray-600 hover:text-orange-500">
                      Dashboard
                    </Link>
                  )}
                  <div className="relative" ref={userMenuRef}>
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center space-x-1 text-gray-600 hover:text-orange-500"
                    >
                      <User className="h-5 w-5" />
                      <span>{user?.name?.split(' ')[0]}</span>
                    </button>
                    {userMenuOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1">
                        <button
                          onClick={() => { handleLogout(); setUserMenuOpen(false); }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Sair
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-gray-600 hover:text-orange-500">
                    Entrar
                  </Link>
                  <Link
                    to="/register"
                    className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
                  >
                    Cadastrar
                  </Link>
                </>
              )}
              <Link to="/cart" className="relative">
                <ShoppingCart className="h-6 w-6 text-gray-600 hover:text-orange-500" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </Link>
            </nav>

            <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="px-4 py-2 space-y-2">
              <Link to="/restaurants" className="block py-2 text-gray-600" onClick={() => setMenuOpen(false)}>
                Restaurantes
              </Link>
              {isAuthenticated ? (
                <>
                  <Link to="/orders" className="block py-2 text-gray-600" onClick={() => setMenuOpen(false)}>
                    Meus Pedidos
                  </Link>
                  <Link to="/profile" className="block py-2 text-gray-600" onClick={() => setMenuOpen(false)}>
                    Meu Perfil
                  </Link>
                  <button onClick={handleLogout} className="block py-2 text-gray-600">
                    Sair
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="block py-2 text-gray-600" onClick={() => setMenuOpen(false)}>
                    Entrar
                  </Link>
                  <Link to="/register" className="block py-2 text-gray-600" onClick={() => setMenuOpen(false)}>
                    Cadastrar
                  </Link>
                </>
              )}
              <Link to="/cart" className="block py-2 text-gray-600" onClick={() => setMenuOpen(false)}>
                Carrinho ({cartItemCount})
              </Link>
            </div>
          </div>
        )}
      </header>

      <main>
        <Outlet />
      </main>

      {/* Notificação de Fila Offline */}
      <OfflineQueueNotification />

      <footer className="bg-gray-800 text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Takeat</h3>
              <p className="text-gray-400">
                A melhor plataforma de delivery de comida.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Links</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/restaurants" className="hover:text-white">Restaurantes</Link></li>
                <li><Link to="/about" className="hover:text-white">Sobre</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contato</h3>
              <p className="text-gray-400">suporte@takeat.com</p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-700 text-center text-gray-400">
            © 2024 Takeat. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
