class GA_PlayerController extends UTPlayerController;

//Update player rotation when walking
state PlayerWalking
{
ignores SeePlayer, HearNoise, Bump;


   function ProcessMove(float DeltaTime, vector NewAccel, eDoubleClickDir DoubleClickMove, rotator DeltaRot)
   {
	  local Vector tempAccel;
		local Rotator CameraRotationYawOnly;
		

      if( Pawn == None )
      {
         return;
      }

	  if(GA_Pawn(Pawn).AttackNode.bIsPlayingCustomAnim || GA_Pawn(Pawn).FallNode.bIsPlayingCustomAnim)
	  {

	  }
	  else
	  {
		  if (Role == ROLE_Authority)
		  {
			 // Update ViewPitch for remote clients
			 Pawn.SetRemoteViewPitch( Rotation.Pitch );
		  }

		  tempAccel.Y =  PlayerInput.aStrafe * DeltaTime * 100 * PlayerInput.MoveForwardSpeed;
		  tempAccel.X = PlayerInput.aForward * DeltaTime * 100 * PlayerInput.MoveForwardSpeed;
		  tempAccel.Z = 0; //no vertical movement for now, may be needed by ladders later
	  }
      
	 //get the controller yaw to transform our movement-accelerations by
	CameraRotationYawOnly.Yaw = Rotation.Yaw; 
	tempAccel = tempAccel>>CameraRotationYawOnly; //transform the input by the camera World orientation so that it's in World frame
	Pawn.Acceleration = tempAccel;
   
	Pawn.FaceRotation(Rotation,DeltaTime); //notify pawn of rotation

    CheckJumpOrDuck();
   }
}

//Controller rotates with turning input
function UpdateRotation( float DeltaTime )
{
local Rotator   DeltaRot, newRotation, ViewRotation;

   ViewRotation = Rotation;
   if (Pawn!=none)
   {
      Pawn.SetDesiredRotation(ViewRotation);
   }

   // Calculate Delta to be applied on ViewRotation
   DeltaRot.Yaw   = PlayerInput.aTurn;
   DeltaRot.Pitch   = PlayerInput.aLookUp;

   ProcessViewRotation( DeltaTime, ViewRotation, DeltaRot );
   SetRotation(ViewRotation);

   NewRotation = ViewRotation;
   NewRotation.Roll = Rotation.Roll;

   if ( Pawn != None )
      Pawn.FaceRotation(NewRotation, deltatime); //notify pawn of rotation
}   

DefaultProperties
{
    
}