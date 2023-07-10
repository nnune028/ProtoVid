from django.shortcuts import render
from agora_token_builder import RtcTokenBuilder
from django.http import JsonResponse
import random
import time
import json
from .models import RoomMember
from django.views.decorators.csrf import csrf_exempt

# Create your views here.

def getToken(request):
    appId = '20723b0b6e0b41b08292140bfe503fd8'
    appCertificate = '0013d525cc7b42849169b4d41483110f'
    channelName = request.GET.get('channel') # Get from the URL
    uid = random.randint(1, 230)
    expirationTimeInSeconds = 3600 * 24 # Expire in 24 hours
    currentTimeStamp = time.time()
    role = 1
    privilegeExpiredTs = currentTimeStamp + expirationTimeInSeconds
    #Build token with uid
    token = RtcTokenBuilder.buildTokenWithUid(appId, appCertificate, channelName, uid, role, privilegeExpiredTs)
    return JsonResponse({'token':token, 'uid':uid}, safe=False)

def lobby(request):
    return render(request, 'base/lobby.html')

def room(request):
    return render(request, 'base/room.html')

@csrf_exempt
def createMember(request): # Store the user in the database
    data = json.loads(request.body)

    member, created = RoomMember.objects.get_or_create(
        name=data['name'],
        uid=data['UID'],
        room_name=data['room_name']
    )
    return JsonResponse({'name':data['name']}, safe=False)

def getMember(request):
    uid = request.GET.get('UID')
    room_name = request.GET.get('room_name')

    member = RoomMember.objects.get(
        uid=uid,
        room_name=room_name,
    )
    name = member.name
    return JsonResponse({'name':member.name}, safe=False)

@csrf_exempt
def deleteMember(request): # Store the user in the database
    data = json.loads(request.body)

    member = RoomMember.objects.get(
        name=data['name'],
        uid=data['UID'],
        room_name=data['room_name'],
    )
    member.delete()
    return JsonResponse('Member was deleted.', safe=False)
