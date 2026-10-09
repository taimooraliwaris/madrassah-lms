import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {Outlet,createRootRouteWithContext,Link} from '@tanstack/react-router';
import {AuthProvider} from '@/contexts/AuthContext';
import {BrandingProvider} from '@/contexts/BrandingContext';
import {Toaster} from '@/components/ui/sonner';
export const Route=createRootRouteWithContext<{queryClient:QueryClient}>()({component:Root,notFoundComponent:()=> <main className="p-8"><h1>Page not found</h1><Link to="/login">Open demo</Link></main>});
function Root(){const {queryClient}=Route.useRouteContext();return <QueryClientProvider client={queryClient}><AuthProvider><BrandingProvider><div className="border-b bg-primary text-primary-foreground px-4 py-2 text-center text-xs">Read-only demo · Fictional sample data <a href="https://www.taimooraliwaris.me/#contact" target="_blank" rel="noopener noreferrer" className="underline ml-4">Request guided demo</a></div><Outlet/><Toaster richColors position="top-right"/></BrandingProvider></AuthProvider></QueryClientProvider>}
