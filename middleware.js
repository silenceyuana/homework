import { NextResponse } from 'next/server';

export function middleware(request) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host');
  
  // 请修改为你自己的后台域名
  const ADMIN_DOMAIN = 'admin.your-site.com'; 

  // 如果访问的是 /admin.html 且域名不对，重定向回主页
  if (url.pathname.startsWith('/admin.html') && hostname !== ADMIN_DOMAIN) {
     return NextResponse.redirect(new URL('/', request.url));
  }

  // 如果是用后台域名访问，并且访问的是根目录 /，重定向到 /admin.html
  if (hostname === ADMIN_DOMAIN && url.pathname === '/') {
    return NextResponse.rewrite(new URL('/admin.html', request.url));
  }
  
  // 如果是用后台域名访问 api/admin 相关接口，放行；访问其他页面，禁止
  if (hostname === ADMIN_DOMAIN) {
      if (!url.pathname.startsWith('/api') && !url.pathname.startsWith('/admin.html') && !url.pathname.startsWith('/style.css')) {
          return NextResponse.redirect(new URL('/admin.html', request.url));
      }
  }

  return NextResponse.next();
}