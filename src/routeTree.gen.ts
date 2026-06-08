/* eslint-disable */
// @ts-nocheck
// noinspection JSUnusedGlobalSymbols

import { Route as rootRouteImport } from './routes/__root'
import { Route as VerificarEmailRouteImport } from './routes/verificar-email'
import { Route as ResetPasswordRouteImport } from './routes/reset-password'
import { Route as RecuperarSenhaRouteImport } from './routes/recuperar-senha'
import { Route as ProdutosRouteImport } from './routes/produtos'
import { Route as PedidosRouteImport } from './routes/pedidos'
import { Route as LoginRouteImport } from './routes/login'
import { Route as ContaRouteImport } from './routes/conta'
import { Route as CheckoutRouteImport } from './routes/checkout'
import { Route as CarrinhoRouteImport } from './routes/carrinho'
import { Route as CadastroRouteImport } from './routes/cadastro'
import { Route as AdminRouteImport } from './routes/admin'
import { Route as IndexRouteImport } from './routes/index'
import { Route as ProdutoIdRouteImport } from './routes/produto.$id'
import { Route as PedidoIdRouteImport } from './routes/pedido.$id'
import { Route as ApiMercadopagoStatusRouteImport } from './routes/api/mercadopago.status'
import { Route as ApiMercadopagoCreateRouteImport } from './routes/api/mercadopago.create'
import { Route as ApiPublicMercadopagoWebhookRouteImport } from './routes/api/public/mercadopago.webhook'

const VerificarEmailRoute = VerificarEmailRouteImport.update({ id: '/verificar-email', path: '/verificar-email', getParentRoute: () => rootRouteImport } as any)
const ResetPasswordRoute = ResetPasswordRouteImport.update({ id: '/reset-password', path: '/reset-password', getParentRoute: () => rootRouteImport } as any)
const RecuperarSenhaRoute = RecuperarSenhaRouteImport.update({ id: '/recuperar-senha', path: '/recuperar-senha', getParentRoute: () => rootRouteImport } as any)
const ProdutosRoute = ProdutosRouteImport.update({ id: '/produtos', path: '/produtos', getParentRoute: () => rootRouteImport } as any)
const PedidosRoute = PedidosRouteImport.update({ id: '/pedidos', path: '/pedidos', getParentRoute: () => rootRouteImport } as any)
const LoginRoute = LoginRouteImport.update({ id: '/login', path: '/login', getParentRoute: () => rootRouteImport } as any)
const ContaRoute = ContaRouteImport.update({ id: '/conta', path: '/conta', getParentRoute: () => rootRouteImport } as any)
const CheckoutRoute = CheckoutRouteImport.update({ id: '/checkout', path: '/checkout', getParentRoute: () => rootRouteImport } as any)
const CarrinhoRoute = CarrinhoRouteImport.update({ id: '/carrinho', path: '/carrinho', getParentRoute: () => rootRouteImport } as any)
const CadastroRoute = CadastroRouteImport.update({ id: '/cadastro', path: '/cadastro', getParentRoute: () => rootRouteImport } as any)
const AdminRoute = AdminRouteImport.update({ id: '/admin', path: '/admin', getParentRoute: () => rootRouteImport } as any)
const IndexRoute = IndexRouteImport.update({ id: '/', path: '/', getParentRoute: () => rootRouteImport } as any)
const ProdutoIdRoute = ProdutoIdRouteImport.update({ id: '/produto/$id', path: '/produto/$id', getParentRoute: () => rootRouteImport } as any)
const PedidoIdRoute = PedidoIdRouteImport.update({ id: '/pedido/$id', path: '/pedido/$id', getParentRoute: () => rootRouteImport } as any)
const ApiMercadopagoStatusRoute = ApiMercadopagoStatusRouteImport.update({ id: '/api/mercadopago/status', path: '/api/mercadopago/status', getParentRoute: () => rootRouteImport } as any)
const ApiMercadopagoCreateRoute = ApiMercadopagoCreateRouteImport.update({ id: '/api/mercadopago/create', path: '/api/mercadopago/create', getParentRoute: () => rootRouteImport } as any)
const ApiPublicMercadopagoWebhookRoute = ApiPublicMercadopagoWebhookRouteImport.update({ id: '/api/public/mercadopago/webhook', path: '/api/public/mercadopago/webhook', getParentRoute: () => rootRouteImport } as any)

export interface FileRoutesByFullPath {
  '/': typeof IndexRoute
  '/admin': typeof AdminRoute
  '/cadastro': typeof CadastroRoute
  '/carrinho': typeof CarrinhoRoute
  '/checkout': typeof CheckoutRoute
  '/conta': typeof ContaRoute
  '/login': typeof LoginRoute
  '/pedidos': typeof PedidosRoute
  '/produtos': typeof ProdutosRoute
  '/recuperar-senha': typeof RecuperarSenhaRoute
  '/reset-password': typeof ResetPasswordRoute
  '/verificar-email': typeof VerificarEmailRoute
  '/pedido/$id': typeof PedidoIdRoute
  '/produto/$id': typeof ProdutoIdRoute
  '/api/mercadopago/status': typeof ApiMercadopagoStatusRoute
  '/api/mercadopago/create': typeof ApiMercadopagoCreateRoute
  '/api/public/mercadopago/webhook': typeof ApiPublicMercadopagoWebhookRoute
}
export interface FileRoutesByTo {
  '/': typeof IndexRoute
  '/admin': typeof AdminRoute
  '/cadastro': typeof CadastroRoute
  '/carrinho': typeof CarrinhoRoute
  '/checkout': typeof CheckoutRoute
  '/conta': typeof ContaRoute
  '/login': typeof LoginRoute
  '/pedidos': typeof PedidosRoute
  '/produtos': typeof ProdutosRoute
  '/recuperar-senha': typeof RecuperarSenhaRoute
  '/reset-password': typeof ResetPasswordRoute
  '/verificar-email': typeof VerificarEmailRoute
  '/pedido/$id': typeof PedidoIdRoute
  '/produto/$id': typeof ProdutoIdRoute
  '/api/mercadopago/status': typeof ApiMercadopagoStatusRoute
  '/api/mercadopago/create': typeof ApiMercadopagoCreateRoute
  '/api/public/mercadopago/webhook': typeof ApiPublicMercadopagoWebhookRoute
}
export interface FileRoutesById {
  __root__: typeof rootRouteImport
  '/': typeof IndexRoute
  '/admin': typeof AdminRoute
  '/cadastro': typeof CadastroRoute
  '/carrinho': typeof CarrinhoRoute
  '/checkout': typeof CheckoutRoute
  '/conta': typeof ContaRoute
  '/login': typeof LoginRoute
  '/pedidos': typeof PedidosRoute
  '/produtos': typeof ProdutosRoute
  '/recuperar-senha': typeof RecuperarSenhaRoute
  '/reset-password': typeof ResetPasswordRoute
  '/verificar-email': typeof VerificarEmailRoute
  '/pedido/$id': typeof PedidoIdRoute
  '/produto/$id': typeof ProdutoIdRoute
  '/api/mercadopago/status': typeof ApiMercadopagoStatusRoute
  '/api/mercadopago/create': typeof ApiMercadopagoCreateRoute
  '/api/public/mercadopago/webhook': typeof ApiPublicMercadopagoWebhookRoute
}
export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths: '/' | '/admin' | '/cadastro' | '/carrinho' | '/checkout' | '/conta' | '/login' | '/pedidos' | '/produtos' | '/recuperar-senha' | '/reset-password' | '/verificar-email' | '/pedido/$id' | '/produto/$id' | '/api/mercadopago/status' | '/api/mercadopago/create' | '/api/public/mercadopago/webhook'
  fileRoutesByTo: FileRoutesByTo
  to: '/' | '/admin' | '/cadastro' | '/carrinho' | '/checkout' | '/conta' | '/login' | '/pedidos' | '/produtos' | '/recuperar-senha' | '/reset-password' | '/verificar-email' | '/pedido/$id' | '/produto/$id' | '/api/mercadopago/status' | '/api/mercadopago/create' | '/api/public/mercadopago/webhook'
  id: '__root__' | '/' | '/admin' | '/cadastro' | '/carrinho' | '/checkout' | '/conta' | '/login' | '/pedidos' | '/produtos' | '/recuperar-senha' | '/reset-password' | '/verificar-email' | '/pedido/$id' | '/produto/$id' | '/api/mercadopago/status' | '/api/mercadopago/create' | '/api/public/mercadopago/webhook'
  fileRoutesById: FileRoutesById
}
export interface RootRouteChildren {
  IndexRoute: typeof IndexRoute
  AdminRoute: typeof AdminRoute
  CadastroRoute: typeof CadastroRoute
  CarrinhoRoute: typeof CarrinhoRoute
  CheckoutRoute: typeof CheckoutRoute
  ContaRoute: typeof ContaRoute
  LoginRoute: typeof LoginRoute
  PedidosRoute: typeof PedidosRoute
  ProdutosRoute: typeof ProdutosRoute
  RecuperarSenhaRoute: typeof RecuperarSenhaRoute
  ResetPasswordRoute: typeof ResetPasswordRoute
  VerificarEmailRoute: typeof VerificarEmailRoute
  PedidoIdRoute: typeof PedidoIdRoute
  ProdutoIdRoute: typeof ProdutoIdRoute
  ApiMercadopagoStatusRoute: typeof ApiMercadopagoStatusRoute
  ApiMercadopagoCreateRoute: typeof ApiMercadopagoCreateRoute
  ApiPublicMercadopagoWebhookRoute: typeof ApiPublicMercadopagoWebhookRoute
}

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/verificar-email': { id: '/verificar-email'; path: '/verificar-email'; fullPath: '/verificar-email'; preLoaderRoute: typeof VerificarEmailRouteImport; parentRoute: typeof rootRouteImport }
    '/reset-password': { id: '/reset-password'; path: '/reset-password'; fullPath: '/reset-password'; preLoaderRoute: typeof ResetPasswordRouteImport; parentRoute: typeof rootRouteImport }
    '/recuperar-senha': { id: '/recuperar-senha'; path: '/recuperar-senha'; fullPath: '/recuperar-senha'; preLoaderRoute: typeof RecuperarSenhaRouteImport; parentRoute: typeof rootRouteImport }
    '/produtos': { id: '/produtos'; path: '/produtos'; fullPath: '/produtos'; preLoaderRoute: typeof ProdutosRouteImport; parentRoute: typeof rootRouteImport }
    '/pedidos': { id: '/pedidos'; path: '/pedidos'; fullPath: '/pedidos'; preLoaderRoute: typeof PedidosRouteImport; parentRoute: typeof rootRouteImport }
    '/login': { id: '/login'; path: '/login'; fullPath: '/login'; preLoaderRoute: typeof LoginRouteImport; parentRoute: typeof rootRouteImport }
    '/conta': { id: '/conta'; path: '/conta'; fullPath: '/conta'; preLoaderRoute: typeof ContaRouteImport; parentRoute: typeof rootRouteImport }
    '/checkout': { id: '/checkout'; path: '/checkout'; fullPath: '/checkout'; preLoaderRoute: typeof CheckoutRouteImport; parentRoute: typeof rootRouteImport }
    '/carrinho': { id: '/carrinho'; path: '/carrinho'; fullPath: '/carrinho'; preLoaderRoute: typeof CarrinhoRouteImport; parentRoute: typeof rootRouteImport }
    '/cadastro': { id: '/cadastro'; path: '/cadastro'; fullPath: '/cadastro'; preLoaderRoute: typeof CadastroRouteImport; parentRoute: typeof rootRouteImport }
    '/admin': { id: '/admin'; path: '/admin'; fullPath: '/admin'; preLoaderRoute: typeof AdminRouteImport; parentRoute: typeof rootRouteImport }
    '/': { id: '/'; path: '/'; fullPath: '/'; preLoaderRoute: typeof IndexRouteImport; parentRoute: typeof rootRouteImport }
    '/produto/$id': { id: '/produto/$id'; path: '/produto/$id'; fullPath: '/produto/$id'; preLoaderRoute: typeof ProdutoIdRouteImport; parentRoute: typeof rootRouteImport }
    '/pedido/$id': { id: '/pedido/$id'; path: '/pedido/$id'; fullPath: '/pedido/$id'; preLoaderRoute: typeof PedidoIdRouteImport; parentRoute: typeof rootRouteImport }
    '/api/mercadopago/status': { id: '/api/mercadopago/status'; path: '/api/mercadopago/status'; fullPath: '/api/mercadopago/status'; preLoaderRoute: typeof ApiMercadopagoStatusRouteImport; parentRoute: typeof rootRouteImport }
    '/api/mercadopago/create': { id: '/api/mercadopago/create'; path: '/api/mercadopago/create'; fullPath: '/api/mercadopago/create'; preLoaderRoute: typeof ApiMercadopagoCreateRouteImport; parentRoute: typeof rootRouteImport }
    '/api/public/mercadopago/webhook': { id: '/api/public/mercadopago/webhook'; path: '/api/public/mercadopago/webhook'; fullPath: '/api/public/mercadopago/webhook'; preLoaderRoute: typeof ApiPublicMercadopagoWebhookRouteImport; parentRoute: typeof rootRouteImport }
  }
}

const rootRouteChildren: RootRouteChildren = {
  IndexRoute,
  AdminRoute,
  CadastroRoute,
  CarrinhoRoute,
  CheckoutRoute,
  ContaRoute,
  LoginRoute,
  PedidosRoute,
  ProdutosRoute,
  RecuperarSenhaRoute,
  ResetPasswordRoute,
  VerificarEmailRoute,
  PedidoIdRoute,
  ProdutoIdRoute,
  ApiMercadopagoStatusRoute,
  ApiMercadopagoCreateRoute,
  ApiPublicMercadopagoWebhookRoute,
}

export const routeTree = rootRouteImport
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()
