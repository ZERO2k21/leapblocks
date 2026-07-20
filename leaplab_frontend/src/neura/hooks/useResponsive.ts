import { useState, useEffect } from 'react'

export function useIsMobile(breakpoint = 768): boolean {
    const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpoint)
    useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth < breakpoint)
        window.addEventListener('resize', onResize)
        return () => window.removeEventListener('resize', onResize)
    }, [breakpoint])
    return isMobile
}

export function useIsTablet(breakpoint = 1024): boolean {
    const [isTablet, setIsTablet] = useState(() => window.innerWidth < breakpoint)
    useEffect(() => {
        const onResize = () => setIsTablet(window.innerWidth < breakpoint)
        window.addEventListener('resize', onResize)
        return () => window.removeEventListener('resize', onResize)
    }, [breakpoint])
    return isTablet
}
