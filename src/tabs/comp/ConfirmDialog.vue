<template>
    <v-dialog v-model="show" max-width="25rem">
        <v-card>
            <v-card-title class="text-h5">{{ title }}</v-card-title>
            <v-card-text>{{ message }}</v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="success" variant="text" @click="cancel" class="text-capitalize">
                    {{ cancelText }}
                </v-btn>
                <v-btn color="error" variant="text" @click="confirm" class="text-capitalize">
                    {{ confirmText }}
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script>
export default {
    props: {
        modelValue: Boolean,
        title: String,
        message: String,
        cancelText: {
            type: String,
            default: 'Cancel'
        },
        confirmText: {
            type: String,
            default: 'Confirm'
        }
    },
    emits: ['update:modelValue', 'confirm', 'cancel'],
    computed: {
        show: {
            get() {
                return this.modelValue;
            },
            set(value) {
                this.$emit('update:modelValue', value);
            }
        }
    },
    methods: {
        confirm() {
            this.$emit('confirm');
            this.show = false;
        },
        cancel() {
            this.show = false;
        }
    },
}
</script>
