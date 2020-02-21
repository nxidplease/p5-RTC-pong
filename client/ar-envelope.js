class AREnvelope{
	constructor(ctx, input){
		this.ctx = ctx;
		this.input = input;
	}

	play(attack, release){
		const now = this.ctx.currentTime;
		this.input.cancelScheduledValues(now);
		this.input.setValueAtTime(0, now);
		this.input.linearRampToValueAtTime(1, now + attack);
		this.input.linearRampToValueAtTime(0, now + attack + release);
	}
}