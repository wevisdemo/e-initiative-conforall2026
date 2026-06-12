<script lang="ts">
	import { onMount } from 'svelte';

	export let date: Date;

	let updatedText = '';

	onMount(() => {
		const [day, month, year, time] = new Date(date)
			.toLocaleString('th-TH', {
				dateStyle: 'medium',
				timeStyle: 'short',
			})
			.split(' ');

		updatedText = `${day} ${month} ${year.slice(2, 4)} ${time}`;
	});
</script>

<p
	class="body-01 opacity-50 {updatedText
		? 'block'
		: 'invisible'} {$$restProps.class}"
>
	อัปเดตข้อมูล {updatedText}
</p>
