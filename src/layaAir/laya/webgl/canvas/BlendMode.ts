import { WebGLContext } from "../WebGLContext"
	
	export class BlendMode
	{
		 static activeBlendFunction:Function = null;
		 static NAMES:any[] = /*[STATIC SAFE]*/["normal", "add", "multiply", "screen", "overlay", "light", "mask", "destination-out"];
		 static TOINT:any = /*[STATIC SAFE]*/{ "normal":0, "add":1, "multiply":2, "screen":3 , "overlay":4, "light":5, "mask":6, "destination-out":7, "lighter":1 };
		
		 static NORMAL:string = "normal";					//0
		 static ADD:string = "add";							//1
		 static MULTIPLY:string = "multiply";				//2
		 static SCREEN:string = "screen";					//3
		 static OVERLAY:string = "overlay";					//4
		 static LIGHT:string = "light";						//5
		 static MASK:string = "mask";						//6
		 static DESTINATIONOUT:string = "destination-out";	//7
		 static LIGHTER:string = "lighter";					//1  等同于加色法
		
		 static fns:any[] = [];
		 static targetFns:any[] = [];
		
		 static _init_(gl:WebGLContext):void
		{
			BlendMode.fns = [BlendMode.BlendNormal, BlendMode.BlendAdd, BlendMode.BlendMultiply, BlendMode.BlendScreen, BlendMode.BlendOverlay, BlendMode.BlendLight, BlendMode.BlendMask,BlendMode.BlendDestinationOut];
			BlendMode.targetFns = [BlendMode.BlendNormalTarget, BlendMode.BlendAddTarget, BlendMode.BlendMultiplyTarget, BlendMode.BlendScreenTarget, BlendMode.BlendOverlayTarget, BlendMode.BlendLightTarget,BlendMode.BlendMask,BlendMode.BlendDestinationOut];
		}
		
		 static BlendNormal(gl:WebGLContext):void
		{
			//为了避免黑边，和canvas作为贴图的黑边
			WebGLContext.setBlendFunc(gl, WebGLContext.ONE, WebGLContext.ONE_MINUS_SRC_ALPHA);
		}

		 static BlendAdd(gl:WebGLContext):void
		{
			WebGLContext.setBlendFunc(gl, WebGLContext.ONE, WebGLContext.DST_ALPHA);
		}
		
		//TODO:coverage
		 static BlendMultiply(gl:WebGLContext):void
		{
			WebGLContext.setBlendFunc(gl, WebGLContext.DST_COLOR, WebGLContext.ONE_MINUS_SRC_ALPHA);
		}
		
		//TODO:coverage
		 static BlendScreen(gl:WebGLContext):void
		{
			WebGLContext.setBlendFunc(gl, WebGLContext.ONE, WebGLContext.ONE);
		}
		
		//TODO:coverage
		 static BlendOverlay(gl:WebGLContext):void
		{
			WebGLContext.setBlendFunc(gl, WebGLContext.ONE, WebGLContext.ONE_MINUS_SRC_COLOR);
		}
		
		//TODO:coverage
		 static BlendLight(gl:WebGLContext):void
		{
			WebGLContext.setBlendFunc(gl, WebGLContext.ONE, WebGLContext.ONE);
		}
	
		 static BlendNormalTarget(gl:WebGLContext):void
		{
			WebGLContext.setBlendFunc(gl,WebGLContext.ONE, WebGLContext.ONE_MINUS_SRC_ALPHA);
		}
		
		//TODO:coverage
		 static BlendAddTarget(gl:WebGLContext):void
		{
			WebGLContext.setBlendFunc(gl, WebGLContext.ONE, WebGLContext.DST_ALPHA);
		}
		
		//TODO:coverage
		 static BlendMultiplyTarget(gl:WebGLContext):void
		{
			WebGLContext.setBlendFunc(gl, WebGLContext.DST_COLOR, WebGLContext.ONE_MINUS_SRC_ALPHA);
		}
		
		//TODO:coverage
		 static BlendScreenTarget(gl:WebGLContext):void
		{
			WebGLContext.setBlendFunc(gl, WebGLContext.ONE, WebGLContext.ONE);
		}
		
		//TODO:coverage
		 static BlendOverlayTarget(gl:WebGLContext):void
		{
			WebGLContext.setBlendFunc(gl, WebGLContext.ONE, WebGLContext.ONE_MINUS_SRC_COLOR);
		}

		//TODO:coverage
		 static BlendLightTarget(gl:WebGLContext):void
		{
			WebGLContext.setBlendFunc(gl, WebGLContext.ONE, WebGLContext.ONE);
		}
		
		 static BlendMask(gl:WebGLContext):void
		{
			WebGLContext.setBlendFunc(gl, WebGLContext.ZERO, WebGLContext.SRC_ALPHA);
		}
		
		//TODO:coverage
		 static BlendDestinationOut(gl:WebGLContext):void
		{
			WebGLContext.setBlendFunc(gl, WebGLContext.ZERO, WebGLContext.ZERO);
		}
	}

