const self = module.exports = {

    /**
     * Will grab all of the google play links from a given Google Play Console account.
     *
     * @param page -> an optional puppeteer page
     * @return -> a list of dictionary values. Carrying the app name, the package name and the app link.
     */
    grabGooglePlayLinks: async function(page=null) {
        if(page === null) {
            let pEles = await ph.createBrowser()
            page = pEles[1]
        }
        await ph.navigateTo(page, 'https://play.google.com/apps/publish/')
        return await grabLinksFormNextPage(page, [])
    }
};

async function grabLinksFormNextPage(page, playLinks) {
    playLinks = await grabLinksFromPage(page, playLinks)

    let nextPageBtn = await ph.getElement(page, "button[aria-label='Next page']")
    if(nextPageBtn !== undefined) {
        let nextBtnDisabled = await ph.isElementHasAttribute(page, nextPageBtn, 'disabled')
        if(!nextBtnDisabled) {
            await ph.clickOnElement(page, nextPageBtn, 3000, "button[aria-label='Previous page']")
            playLinks = await grabLinksFormNextPage(page, playLinks)
        }
    }

    return playLinks
}


async function grabLinksFromPage(page, playLinks) {
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
        let appLink = currUrl.substring(0, currUrl.indexOf('#AppListPlace')) + appRawLink
        playLinks.push({
            appName: appName,
            packageName: packageName,
            appLink: appLink
        })
    }

    return playLinks
}