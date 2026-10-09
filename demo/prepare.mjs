import { cpSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
rmSync('demo-src', {recursive:true,force:true});
cpSync('src','demo-src',{recursive:true});
for (const [source,target] of [['root.tsx','routes/__root.tsx'],['client.ts','integrations/supabase/client.ts'],['login.tsx','routes/login.tsx']]) cpSync(`demo/${source}`,`demo-src/${target}`);
writeFileSync('demo-src/lib/users.functions.ts', 'const blocked = async (..._args: any[]) => { throw new Error("Account changes are unavailable in this read-only demo."); }; export const createUserFn = blocked; export const sendPasswordResetFn = blocked;');
for (const f of ['components/forms/UserFormDialog.tsx','routes/admin/users/index.tsx']) {
 let s=readFileSync(`demo-src/${f}`,'utf8').replace(/import \{ useServerFn \} from "@tanstack\/react-start";/,'const useServerFn = <T,>(fn: T): T => fn;');
 writeFileSync(`demo-src/${f}`,s);
}
// The demo is a standalone SPA. No server entry, service client or auth middleware is reachable.
for (const f of ['start.ts','server.ts','integrations/supabase/client.server.ts','integrations/supabase/auth-middleware.ts','integrations/supabase/auth-attacher.ts']) rmSync(`demo-src/${f}`,{force:true});
writeFileSync('demo-src/demo-main.tsx',`import React from 'react'; import { createRoot } from 'react-dom/client'; import { RouterProvider } from '@tanstack/react-router'; import { getRouter } from './router'; import './styles.css'; createRoot(document.getElementById('root')!).render(<RouterProvider router={getRouter()}/>);`);
writeFileSync('demo-src/routes/index.tsx', `import {createFileRoute,Navigate} from '@tanstack/react-router'; export const Route=createFileRoute('/')({component:()=> <Navigate to="/login"/>});`);
