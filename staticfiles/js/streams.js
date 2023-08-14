const APP_ID = '20723b0b6e0b41b08292140bfe503fd8'
const CHANNEL = sessionStorage.getItem('room')
const TOKEN = sessionStorage.getItem('token')
let UID = Number(sessionStorage.getItem('UID'))
let NAME = sessionStorage.getItem('name')

const client = AgoraRTC.createClient({mode:'rtc', codec:'vp8'})

let localTracks = [] // Audio and Video tracks
let remoteUsers = {}

let joinAndDisplayLocalStream = async () => {
    document.getElementById('room-name').innerText = CHANNEL

    client.on('user-published', handleUserJoined) // Whenever user publishes their track, call handleUserJoined
    client.on('user-left', handleUserLeft) // Whenever user leaves, call handleUserLeft

    try {
        await client.join(APP_ID, CHANNEL, TOKEN, UID) // Join the channel
    }
    catch (error) {
        console.error(error)
        window.open('/', '_self')
    }

    localTracks = await AgoraRTC.createMicrophoneAndCameraTracks() // Get audio and video tracks

    let member = await createMember()

    let player = `<div class="video-container" id="user-container-${UID}">
    <div class="username-wrapper"><span class="user-name">${member.name}</span></div>
    <div class="video-player" id="user-${UID}"></div>
    </div>` // Create player
    document.getElementById('video-streams').insertAdjacentHTML('beforeend', player) // Append the player to the stream

    localTracks[1].play(`user-${UID}`) // Play that method

    await client.publish([localTracks[0], localTracks[1]]) // Publish the track
}

let handleUserJoined = async (user, mediaType) => { // Adds user to chatroom
    remoteUsers[user.uid] = user // Add user to remote users
    await client.subscribe(user, mediaType) // Subscribe to remote user

    if(mediaType === 'video') {
        // Build video player and display in DOM
        let player = document.getElementById(`user-container-${user.uid}`) // Get the video source
        if (player != null) {
            player.remove()
        }

        let member = await getMember(user)

        player = `<div class="video-container" id="user-container-${user.uid}">
                    <div class="username-wrapper"><span class="user-name">${member.name}</span></div>
                    <div class="video-player" id="user-${user.uid}"></div>
                </div>` // Create player
        document.getElementById('video-streams').insertAdjacentHTML('beforeend', player) // Append the player to the stream
        user.videoTrack.play(`user-${user.uid}`)

        if (mediaType === 'audio') { // Easy since audio does not require any display
            user.audioTrack.play()
        }
    }
}

let handleUserLeft = async (user) => { // Removes the user that leaves
    delete remoteUsers[user.uid]
    document.getElementById(`user-container-${user.uid}`).remove()
}

let leaveAndRemoveLocalStream = async () => {
    for (let i = 0; i < localTracks.length; i++) { // Close tracks
        localTracks[i].stop()
        localTracks[i].close()
    }

    await client.leave()

    deleteMember()

    window.open('/', '_self') // Redirect user
}

let toggleCamera = async (e) => {
    if (localTracks[1].muted) {
        await localTracks[1].setMuted(false)
        e.target.style.backgroundColor = 'white'
    }
    else {
        await localTracks[1].setMuted(true)
        e.target.style.backgroundColor = 'red'
    }
}

let toggleMic = async (e) => {
    if (localTracks[0].muted) {
        await localTracks[0].setMuted(false)
        e.target.style.backgroundColor = 'white'
    }
    else {
        await localTracks[0].setMuted(true)
        e.target.style.backgroundColor = 'red'
    }
}

let createMember = async () => {
    let response = await fetch('/create_member/', {
        method:'POST',
        headers:{
            'Content-Type':'application/json'
        },
        body:JSON.stringify({'name':NAME, 'room_name':CHANNEL, 'UID':UID})
    })
    let member = await response.json()
    return member
}

let getMember = async (user) => {
    let response = await fetch(`/get_member/?UID=${user.uid}&room_name=${CHANNEL}`)
    let member = await response.json()
    return member
}

let deleteMember = async () => {
    let response = await fetch('/delete_member/', {
        method:'POST',
        headers: {
            'Content-Type':'application/json'
        },
        body:JSON.stringify({'name':NAME, 'room_name':CHANNEL, 'UID':UID})
    })
    let member = await response.json()
}

joinAndDisplayLocalStream()

window.addEventListener('beforeunload', deleteMember)

document.getElementById('leave-btn').addEventListener('click', leaveAndRemoveLocalStream)
document.getElementById('camera-btn').addEventListener('click', toggleCamera)
document.getElementById('mic-btn').addEventListener('click', toggleMic)