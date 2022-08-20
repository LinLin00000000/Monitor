import { Schema } from '../../common/schema'
import { performanceMonitor } from './perfomance'
import { mixinBefore, addEventListener } from './utils'

export default function load(
    report: <T extends keyof Schema>(type: T, data: Schema[T], lazy?: boolean) => void
) {
    // 监控 js 错误
    addEventListener(window, 'error', (e) => {
        if (e.error) {
            report(
                'jsError',
                {
                    message: e.error.message,
                    line: e.error.lineNumber,
                    column: e.error.columnNumber,
                    stack: e.error.stack,
                    href: e.error.fileName,
                    startTime: e.timeStamp,
                },
                false
            )
        }
    })

    // 监控 Promise 错误
    addEventListener(window, 'unhandledrejection', (e) => {
        console.log(e)
        report(
            'promiseError',
            {
                stack: e.reason.stack,
                href: e.reason.fileName,
                startTime: e.timeStamp,
            },
            false
        )
    })

    // 监控 console.error
    mixinBefore(window.console, 'error', (...args: string[]) => {
        report(
            'consoleError',
            {
                href: window.location.href,
                startTime: performance.now(),
                errorData: args,
            },
            false
        )
    })

    // 监控资源异常
    addEventListener(
        window,
        'error',
        (e) => {
            const target = e.target as HTMLImageElement & HTMLBaseElement
            if (!target) return

            if (target.src || target.href) {
                console.log(e)
                report(
                    'resourceError',
                    {
                        source: target.src || target.href,
                        startTime: e.timeStamp,
                        html: target.outerHTML,
                        resourceType: target.tagName,
                        href: window.location.href,
                    },
                    false
                )
            }
        },
        true
    )

    // 基础性能指标
    window.addEventListener('load', () => {
        // console.log(performanceMonitor.showAllApis());
        report({
            DOMCompleteTime: performanceMonitor.getDOMCompleteTime(),
            FPTime: performanceMonitor.getFirstPaintTime(),
            FCPTime: performanceMonitor.getFirstContentPaintTime(),
            FMPTime: '',
            FWPTime: performanceMonitor.getWhiteScreenTime(),
            DNSTime: performanceMonitor.getDNSTime(),

        }, false);
    }
)
}
