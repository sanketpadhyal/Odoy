import "./ChatSettings.css"

import {
FiArrowLeft,
FiDatabase,
FiTrash2,
FiRefreshCw
} from "react-icons/fi"

import { useNavigate, useSearchParams } from "react-router-dom"
import { useState, useEffect } from "react"

export default function StorageSettings(){

const navigate = useNavigate()
const [params] = useSearchParams()
const authToken = params.get("auth")

const [localSize,setLocalSize] = useState("0 KB")
const [sessionSize,setSessionSize] = useState("0 KB")
const [cacheSize,setCacheSize] = useState("0 KB")

const [clearingLocal,setClearingLocal] = useState(false)
const [clearingCache,setClearingCache] = useState(false)

useEffect(()=>{

let localTotal = 0
let sessionTotal = 0

for(let key in localStorage){
if(localStorage.hasOwnProperty(key)){
localTotal += ((localStorage[key].length + key.length) * 2)
}
}

for(let key in sessionStorage){
if(sessionStorage.hasOwnProperty(key)){
sessionTotal += ((sessionStorage[key].length + key.length) * 2)
}
}

const localKB = (localTotal / 1024).toFixed(2)
const sessionKB = (sessionTotal / 1024).toFixed(2)

setLocalSize(localKB + " KB")
setSessionSize(sessionKB + " KB")

calculateCache()

},[])

const calculateCache = async () => {

if(!("caches" in window)){
setCacheSize("0 KB")
return
}

let total = 0

const keys = await caches.keys()

for(const key of keys){

const cache = await caches.open(key)

const requests = await cache.keys()

for(const req of requests){

const res = await cache.match(req)

if(res){
const blob = await res.clone().blob()
total += blob.size
}

}

}

const mb = (total / (1024 * 1024)).toFixed(2)

setCacheSize(mb + " MB")

}

const clearLocalStorage = () => {

if(clearingLocal) return

setClearingLocal(true)

setTimeout(()=>{

localStorage.clear()
sessionStorage.clear()

window.location.reload()

},1600)

}

const clearCache = async () => {

if(clearingCache) return

setClearingCache(true)

if("caches" in window){

const keys = await caches.keys()

for(const key of keys){
await caches.delete(key)
}

}

setTimeout(()=>{

setCacheSize("0 MB")
setClearingCache(false)

},1600)

}

const goBack = () => {

document.body.classList.add("page-turn")

setTimeout(()=>{

navigate(`/friends${authToken ? `?auth=${authToken}` : ""}`)

document.body.classList.remove("page-turn")

},280)

}

return(

<section className="chatsettings-page page-animate">

<div className="settings-top-row">

<div className="settings-back-btn" onClick={goBack}>
<FiArrowLeft className="settings-back-icon"/>
<span>Back</span>
</div>

</div>

<br/>

<div className="settings-title">
<span className="settings-title-sub">STORAGE</span>
</div>

<div className="settings-premium-line">
- Manage your app storage and cached data -
</div>

<br/>

<div className="settings-list">

<div className="settings-card dotted">

<div className="s-left">
<FiDatabase/>
<p>LocalStorage</p>
</div>

<p style={{fontWeight:"700"}}>{localSize}</p>

</div>

<div className="settings-card dotted">

<div className="s-left">
<FiDatabase/>
<p>Cache Storage</p>
</div>

<p style={{fontWeight:"700"}}>{cacheSize}</p>

</div>

<div className="settings-card dotted">

<div className="s-left">
<FiDatabase/>
<p>Session Storage</p>
</div>

<p style={{fontWeight:"700"}}>{sessionSize}</p>

</div>

<div className="settings-card" onClick={clearLocalStorage}>

<div className="s-left">

{clearingLocal ?

<div className="loader360"></div>

:

<FiTrash2 className="clean-icon"/>

}

<p>

{clearingLocal ? "Cleaning Local Storage..." : "Clear Local Storage"}

</p>

</div>

</div>

<div className="settings-card" onClick={clearCache}>

<div className="s-left">

{clearingCache ?

<div className="loader360"></div>

:

<FiRefreshCw className="clean-icon"/>

}

<p>

{clearingCache ? "Cleaning Cache..." : "Clear Cache"}

</p>

</div>

</div>

<p className="settings-footer">
Cleaning storage can fix loading or sync issues.
</p>

</div>

</section>

)

}