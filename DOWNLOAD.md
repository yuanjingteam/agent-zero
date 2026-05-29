下载本仓库使用的模型

您可以调整量化（quantization）级别来平衡模型精度（precision）和文件大小：
使用 `:Q8_0` 获得更高的精度和更好的输出质量，但请注意它需要更多的内存和存储空间。
使用 `:Q6_K` 在大小和准确性之间取得良好平衡（推荐默认值）。
使用 `:Q5_K_S` 获得更小的模型，加载更快且使用更少内存，但精度略有降低。

```
npx --no node-llama-cpp pull --dir ./models hf:Qwen/Qwen3-1.7B-GGUF:Q8_0 --filename Qwen3-1.7B-Q8_0.gguf
```

```
npx --no node-llama-cpp pull --dir ./models hf:giladgd/gpt-oss-20b-GGUF/gpt-oss-20b.MXFP4.gguf
```

```
npx --no node-llama-cpp pull --dir ./models hf:unsloth/DeepSeek-R1-0528-Qwen3-8B-GGUF:Q6_K --filename DeepSeek-R1-0528-Qwen3-8B-Q6_K.gguf
```

```
npx --no node-llama-cpp pull --dir ./models hf:giladgd/Apertus-8B-Instruct-2509-GGUF:Q6_K
```
