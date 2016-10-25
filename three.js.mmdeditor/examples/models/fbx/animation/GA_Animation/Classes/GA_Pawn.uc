class GA_Pawn extends UTPawn;

	


var float CamOffsetDistance; //distance to offset the camera from the player in unreal units
var float CamMinDistance, CamMaxDistance;
var float CamZoomTick; //how far to zoom in/out per command
var float CamHeight; //how high cam is relative to pawn pelvis



var AnimNodePlayCustomAnim AttackNode;
var AnimNodePlayCustomAnim PushNode;
var AnimNodePlayCustomAnim FallNode;

var() name WhatEvs;
var() name WhatEvs2;

//stop aim node from aiming up or down
simulated event PostInitAnimTree(SkeletalMeshComponent SkelComp)
{
	super.PostInitAnimTree(SkelComp);
	AimNode.bForceAimDir = true; //forces centercenter
	AttackNode = AnimNodePlayCustomAnim(SkelComp.FindAnimNode('AttackNode'));
	PushNode = AnimNodePlayCustomAnim(SkelComp.FindAnimNode('PushNode'));
	FallNode = AnimNodePlayCustomAnim(SkelComp.FindAnimNode('FallNode'));
}

simulated event PostBeginPlay()
{
	super.PostBeginPlay();
	`Log("Custom Pawn up"); //debug
	
}



simulated event Destroyed()
{
  Super.Destroyed();

  AttackNode = None;
  PushNode = none;
  FallNode = none;
}

function Tick(float DeltaTime)
{
	super.Tick(DeltaTime);

	//if(AttackNode.bIsPlayingCustomAnim)//  || FallNode.bIsPlayingCustomAnim)
	//{
	//	GroundSpeed = 0;
	//	//Velocity.X = 0;
	//	//Velocity.Y = 0;
	//}
	//else
	//{
	//	GroundSpeed = Default.GroundSpeed;
	//	//Velocity = Default.Velocity;
	//}
}


//override to make player mesh visible by default
simulated event BecomeViewTarget( PlayerController PC )
{
   local UTPlayerController UTPC;

   Super.BecomeViewTarget(PC);

   if (LocalPlayer(PC.Player) != None)
   {
      UTPC = UTPlayerController(PC);
      if (UTPC != None)
      {
         //set player controller to behind view and make mesh visible
         UTPC.SetBehindView(true);
         SetMeshVisibility(UTPC.bBehindView); 
         UTPC.bNoCrosshair = true;
      }
   }
}

//only update pawn rotation while moving
simulated function FaceRotation(rotator NewRotation, float DeltaTime)
{
	// Do not update Pawn's rotation if no accel
	if (Normal(Acceleration)!=vect(0,0,0))
	{
		if ( Physics == PHYS_Ladder )
		{
			NewRotation = OnLadder.Walldir;
		}
		else if ( (Physics == PHYS_Walking) || (Physics == PHYS_Falling) )
		{
			NewRotation = rotator((Location + Normal(Acceleration))-Location);
			NewRotation.Pitch = 0;
		}
		
		SetRotation(NewRotation);
	}
	
}


//orbit cam, follows player controller rotation
simulated function bool CalcCamera( float fDeltaTime, out vector out_CamLoc, out rotator out_CamRot, out float out_FOV )
{
	local vector HitLoc,HitNorm, End, Start, vecCamHeight;

	vecCamHeight = vect(0,0,0);
	vecCamHeight.Z = CamHeight;
	Start = Location;
	End = (Location+vecCamHeight)-(Vector(Controller.Rotation) * CamOffsetDistance);  //cam follow behind player controller
	out_CamLoc = End;

	//trace to check if cam running into wall/floor
	if(Trace(HitLoc,HitNorm,End,Start,false,vect(12,12,12))!=none)
	{
		out_CamLoc = HitLoc + vecCamHeight;
	}
	
	//camera will look slightly above player
   out_CamRot=rotator((Location + vecCamHeight) - out_CamLoc);
   return true;
}

exec function CamZoomIn()
{
	`Log("Zoom in");
	if(CamOffsetDistance > CamMinDistance)
		CamOffsetDistance-=CamZoomTick;
}

exec function CamZoomOut()
{
	`Log("Zoom out");
	if(CamOffsetDistance < CamMaxDistance)
		CamOffsetDistance+=CamZoomTick;
}

simulated function StartFire(byte FireModeNum)
{
  if (AttackNode == None)
  {
    return;
  }

	if (!AttackNode.bIsPlayingCustomAnim)
	{
		AttackNode.PlayCustomAnim(WhatEvs, 1.f, 0.1f, 0.1f, false, true);

		//GroundSpeed = 0;
	}
}

//exec function GAAttack()
//{
//	if (AttackNode == None)
//  {
//    return;
//  }

//  if (!AttackNode.bIsPlayingCustomAnim)
//  {
//    AttackNode.PlayCustomAnim('AgentCombat', 1.f, 0.1f, 0.1f, false, true);
//  }

//}

exec function Push()
{
  if (PushNode == None)
  {
    return;
  }

  if (!PushNode.bIsPlayingCustomAnim)
  {
    PushNode.PlayCustomAnim(WhatEvs2, 1.f, 0.1f, 0.1f, true, true);
	
  }

}

exec function StopPush()
{
	 if (PushNode == None)
  {
    return;
  }

  if (PushNode.bIsPlayingCustomAnim)
  {
    PushNode.StopCustomAnim(0.01f);
	
  }

}

exec function FallDown()
{
  if (FallNode == None)
  {
    return;
  }

  //if (!FallNode.bIsPlayingCustomAnim)
  //{
    FallNode.PlayCustomAnim('AgentDeath', 1.f, 0.1f, 0.1f, false, true);
  //}

}




DefaultProperties
{

	WhatEvs = "AgentCombat"
	WhatEvs2 = "AgentPush"


	Begin Object Class=SkeletalMeshComponent Name=GA_SkeletalMesh
       //Your Mesh Properties
      SkeletalMesh=SkeletalMesh'GA_Agent.AgentDefault'
      AnimTreeTemplate=AnimTree'GA_Agent.GA_AnimTree'
      PhysicsAsset=PhysicsAsset'GA_Agent.AgentDefault_Physics'
      AnimSets(0)=AnimSet'GA_Agent.AgentDefault_Anims'
      Translation=(Z=1.0)
      Scale=1.075
      //General Mesh Properties
      bCacheAnimSequenceNodes=FALSE
      AlwaysLoadOnClient=true
      AlwaysLoadOnServer=true
      bOwnerNoSee=false
      CastShadow=true
      BlockRigidBody=TRUE
      bUpdateSkelWhenNotRendered=false
      bIgnoreControllersWhenNotRendered=TRUE
      bUpdateKinematicBonesFromAnimation=true
      bCastDynamicShadow=true
      RBChannel=RBCC_Untitled3
      RBCollideWithChannels=(Untitled3=true)
      LightEnvironment=MyLightEnvironment
      bOverrideAttachmentOwnerVisibility=true
      bAcceptsDynamicDecals=FALSE
      bHasPhysicsAssetInstance=true
      TickGroup=TG_PreAsyncWork
      MinDistFactorForKinematicUpdate=0.2
      bChartDistanceFactor=true
      RBDominanceGroup=20
      bUseOnePassLightingOnTranslucency=TRUE
      bPerBoneMotionBlur=true
   End Object
   Mesh=GA_SkeletalMesh
   Components.Add(GA_SkeletalMesh)

	CamHeight = 40.0
	CamMinDistance = 40.0
	CamMaxDistance = 350.0
   	CamOffsetDistance=250.0
	CamZoomTick=20.0

	bPushesRigidBodies = true
	RBPushStrength = 100
}
