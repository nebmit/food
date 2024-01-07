import { redirect } from '@sveltejs/kit';

const ssoURL = import.meta.env.VITE_SSO_URL;

export async function handle({ event, resolve }) {
    const sessionId = event.cookies.get('session_id');
    if (!sessionId && isProtectedRoute(event.url.pathname)) {
        throw redirect(303, `${ssoURL}/login?redirect_uri=${event.url.href}`);
    }

    const user = await validateToken(sessionId);
    if (user) {
        event.locals = {
            user: {
                isAuthenticated: true
            }
        };
    } else {
        if (isProtectedRoute(event.url.pathname)) {
            throw redirect(303, '/');
        }
    }

    return resolve(event);
}

function isProtectedRoute(pathname: string) {
    if (pathname.startsWith('/recipe')) {
        return false;
    }
    if (pathname.startsWith('/images')) {
        return false;
    }
    if (pathname.match(/\/cart\/.*/)) {
        return false;
    }
    switch (pathname) {
    case '/':
    case '/explore':
    case '/webhook':
        return false;
    }
    return true;
}

async function validateToken(token: string | undefined) {
    if (!token) {
        return false;
    }

    const response = await fetch(`${ssoURL}/api/authenticate`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (response.ok) {
        return true;
    }

    return false;
}

