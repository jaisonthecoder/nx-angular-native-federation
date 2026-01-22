import { Route } from '@angular/router';
import { loadRemoteModule } from '@softarc/native-federation-runtime';
import { authGuard } from '@angola-workspace/shared/auth';

export const appRoutes: Route[] = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'lpco-cnca-app',
    loadComponent: () => loadRemoteModule('lpco-cnca-app', './Component').then(m => m.default || m.AppComponent || m.Component),
    canActivate: [authGuard]
  },
  {
    path: 'unauthorized',
    loadComponent: () => import('./unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent)
  }
,
  {
    path: 'demo-ui-component',
    loadComponent: () => loadRemoteModule('demo-ui-component', './Component').then(m => m.default || m.AppComponent || m.Component),
    // Remote app can also be protected if needed
    // canActivate: [authGuard],
    // data: { roles: [] }
  }
];
