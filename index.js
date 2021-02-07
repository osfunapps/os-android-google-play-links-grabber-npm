const ph = require('os-puppeteer-helper');

const self = module.exports = {

    /**
     * Will grab all of the google play links from a given Google Play Console account.
     *
     * @param page -> an optional puppeteer page
     * @param filterSuspendedRemovedAndRejectedApps -> toggle true to remove suspended, removed or
     * rejected apps from the list
     * @param fireFoxNightlyPath the path to your FireFox Nightly runner file.
     * In Windows that's usually your firefox.exe file (like 'C:/Program Files/Firefox Nightly/firefox.exe').
     * In Mac that's usually your firefox file, located in your Firefox Nightly.app, inside the Applications dir.
     * @return -> a list of dictionary values. Carrying the app name, the package name and the app link.
     */
    grabGooglePlayLinks: async function (page = null,
                                         filterSuspendedRemovedAndRejectedApps = true,
                                         fireFoxNightlyPath = '/Applications/Firefox Nightly.app/Contents/MacOS/firefox') {
        if (page === null) {
            let pEles = await ph.createFirefoxBrowser("about:blank",
                5,
                false,
                1300,
                768,
                fireFoxNightlyPath)
            page = pEles[1]
        }
        await ph.navigateTo(page, 'https://play.google.com/apps/publish/')
        return await grabLinksFormNextPage(page, filterSuspendedRemovedAndRejectedApps, [])
    }
};

async function grabLinksFormNextPage(page, filterSuspendedRemovedAndRejectedApps, playLinks) {
    playLinks = await grabLinksFromPage(page, filterSuspendedRemovedAndRejectedApps, playLinks)

    let nextPageBtn = await ph.getElement(page, "button[aria-label='Next page']")
    if (nextPageBtn !== undefined) {
        let nextBtnDisabled = await ph.isElementHasAttribute(page, nextPageBtn, 'disabled')
        if (!nextBtnDisabled) {
            await ph.clickOnElement(page, nextPageBtn, 3000, "button[aria-label='Previous page']")
            playLinks = await grabLinksFormNextPage(page, filterSuspendedRemovedAndRejectedApps, playLinks)
        }
    }

    return playLinks
}


async function grabLinksFromPage(page, filterSuspendedRemovedAndRejectedApps, playLinks) {
    let APP_INDICATION = 'Application '
    let PACKAGE_NAME_INDICATION = ', package name '
    await ph.waitForSelector(page, "div[__gwt_cell] img")
    let imgEle = await ph.getElements(page, "div[__gwt_cell] img")

    for (let i = 0; i < imgEle.length; i++) {
        let aEle = await ph.getParent(page, imgEle[i])
        let ariaLabel = await ph.getAttributeValueFromElement(page, aEle, 'aria-label')
        let appName = ariaLabel.substring(ariaLabel.indexOf(APP_INDICATION) + APP_INDICATION.length, ariaLabel.indexOf(PACKAGE_NAME_INDICATION))
        let packageName = ariaLabel.substring(ariaLabel.indexOf(PACKAGE_NAME_INDICATION) + PACKAGE_NAME_INDICATION.length)
        let currUrl = await page.url()
        let appRawLink = await ph.getAttributeValueFromElement(page, aEle, 'href')
        let stausAs = await ph.getElements(page, "a[href='" + appRawLink + "']")
        let appStatus = await ph.getAttributeValueFromElement(page, stausAs[3], 'aria-label')
        if (appStatus !== 'App status is Published' && filterSuspendedRemovedAndRejectedApps) {
            continue
        }
        let appLink = currUrl.substring(0, currUrl.indexOf('#AppListPlace')) + appRawLink
        playLinks.push({
            appName: appName,
            packageName: packageName,
            appLink: appLink
        })
    }

    return playLinks
}